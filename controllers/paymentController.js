const stripe = require("stripe")(
  "sk_test_51QEDFEKHTVoAtM1EAie7ysWsMvGHKLWdzK42nCB2wKAHzMS5bsnsCed3NzA5xOmBxIvry084FISHhiJHXnkOLOYN00NaeOoOm7"
);
const User = require("../models/User");
const RentPayment = require("../models/RentPayment"); // RentPayment model
const asyncHandler = require("express-async-handler");
const RentalApplication = require("../models/RentalApplication");
const LeaseAgreement = require("../models/LeaseAgreement");
const Properties= require("../models/Property");
const Notification = require('../models/Notification'); // Import Notification model
const CommissionFee = require("../models/Commission");
// Create Stripe Account
exports.createStripeAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.email) {
      return res
        .status(400)
        .json({ error: "Email is not associated with this user." });
    }

    // Create Stripe Account with test data to resolve requirements
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      business_type: "individual",
      individual: {
        first_name: user.firstName || "Test",
        last_name: user.lastName || "User",
        dob: {
          day: 1,
          month: 1,
          year: 1990,
        },
        address: {
          line1: "123 Test St",
          city: "Test City",
          state: "CA",
          postal_code: "94111",
          country: "US",
        },
      },
      external_account: {
        object: "bank_account",
        country: "US",
        currency: "usd",
        account_holder_name: `${user.firstName || "Test"} ${
          user.lastName || "User"
        }`,
        account_holder_type: "individual",
        routing_number: "110000000", // Stripe test routing number
        account_number: "000123456789", // Stripe test account number
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://yourapp.com/reauth",
      return_url: "https://yourapp.com/success",
      type: "account_onboarding",
    });

    // Store the Stripe Account ID and status in the database
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = "pending"; // Initially mark as pending
    await user.save();

    res.status(200).json({
      message: "Stripe Connect account created successfully.",
      onboardingLink: accountLink.url,
    });
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    res.status(500).json({ error: error.message });
  }
};

// Check Stripe Account Status
exports.checkStripeAccountStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(
      `Received request to check Stripe account status for userId: ${userId}`
    );

    if (!userId) {
      console.error("User ID is missing in the request.");
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found in the database.`);
      return res.status(404).json({ error: "User not found." });
    }

    console.log(`User retrieved: ${JSON.stringify(user)}`);

    if (user.stripeAccountId) {
      console.log(`Stripe account ID found: ${user.stripeAccountId}`);

      // Retrieve the Stripe account details
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      console.log("Stripe account details retrieved:", account);

      // Check if the account is fully enabled
      const isAccountEnabled =
        account.charges_enabled && account.payouts_enabled;
      console.log(
        `Account charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`
      );

      if (isAccountEnabled) {
        console.log(`Stripe account ${user.stripeAccountId} is fully enabled.`);

        // Update the user to indicate their account is ready for use
        user.stripeAccountStatus = "enabled";
        await user.save();
        console.log(
          'User account status updated to "enabled" and saved to database.'
        );

        return res.status(200).json({
          message: "Stripe account is fully enabled.",
          stripeAccountId: user.stripeAccountId,
          accountStatus: "enabled",
        });
      } else {
        console.log(
          `Stripe account ${user.stripeAccountId} is not fully enabled yet.`
        );
        return res.status(200).json({
          message: "Stripe account is not fully enabled yet.",
          stripeAccountId: user.stripeAccountId,
          accountStatus: "pending",
        });
      }
    } else {
      console.log(`User with ID ${userId} does not have a Stripe account.`);
      return res.status(200).json({
        message: "User does not have a Stripe account.",
        hasStripeAccount: false,
      });
    }
  } catch (error) {
    console.error("Error checking Stripe account status:", error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};


exports.processRentPayment = asyncHandler(async (req, res) => {
  const { tenantId, landlordId, leaseId, rentDue, landlordStripeId, month } = req.body;

  // Validate input fields
  if (!tenantId || !landlordId || !leaseId || !rentDue || !landlordStripeId || !month) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Fetch the commission fee
    const commissionFee = await CommissionFee.findOne();
    if (!commissionFee) {
      return res.status(500).json({ message: "Commission fee is not configured" });
    }

    // Calculate the service fee
    const serviceFee = (commissionFee.fee / 100) * rentDue; // Assuming fee is in percentage
    const totalAmount = Math.round(rentDue * 100); // Total amount in cents
    const landlordAmount = Math.round((rentDue - serviceFee) * 100); // Landlord amount in cents

    // Create a PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      application_fee_amount: serviceFee,
      currency: "usd", // Adjust as per your currency
      metadata: { leaseId, tenantId, landlordId },
      transfer_data: {
        destination: landlordStripeId, // Route payment to landlord's Stripe account
        // Landlord receives rent minus service fee
      },
    });

    // Save the payment details in the RentPayment model
    const rentPayment = new RentPayment({
      lease: leaseId,
      tenant: tenantId,
      landlord: landlordId,
      amount: rentDue,
      serviceFee, // Save calculated service fee
      paymentIntentId: paymentIntent.id, // Store the PaymentIntent ID
      paymentStatus: "pending", // Set as pending until confirmation
      month, // Store the month in the database
    });

    await rentPayment.save();

    // Send the PaymentIntent client secret to the frontend
    res.json({
      clientSecret: paymentIntent.client_secret, // Send the client secret to frontend
      message: "Payment initialized. Please confirm the payment via client.",
    });
  } catch (error) {
    console.error("Error processing rent payment:", error);
    res.status(500).json({
      message: "An error occurred while processing your payment. Please try again later.",
    });
  }
});


exports.confirmPayment = async (req, res) => {
  const { paymentIntentId, paymentStatus } = req.body;

  // Validate input fields
  if (!paymentIntentId || !paymentStatus) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Find the rent payment by the PaymentIntent ID and populate tenant and landlord details
    const rentPayment = await RentPayment.findOne({ paymentIntentId })
      .populate("tenant", "firstName lastName") // Fetch tenant's firstName and lastName
      .populate("landlord", "name") // Fetch landlord's name if needed
      .populate("lease", "propertyId"); // Fetch lease details to get propertyId

    if (!rentPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Extract the month name from the `month` field (e.g., "2024-09")
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const [year, month] = rentPayment.month.split("-"); // Split "2024-09" into ["2024", "09"]
    const monthIndex = parseInt(month, 10) - 1; // Convert "09" to 8 (0-based index for array lookup)
    const monthName = monthNames[monthIndex]; // Get the full month name, e.g., "September"

    // Check if the payment status is "completed"
    if (paymentStatus === "completed") {
      // Update the payment status to "completed"
      rentPayment.paymentStatus = "completed";

      // Notification Logic
      try {
        const landlordId = rentPayment.landlord._id; // Landlord ID from RentPayment
        const tenantFirstName = rentPayment.tenant.firstName; // Tenant's first name
        const tenantLastName = rentPayment.tenant.lastName; // Tenant's last name
        const tenantFullName = `${tenantFirstName} ${tenantLastName}`; // Tenant's full name
        const amount = rentPayment.amount; // Payment amount

        // Fetch property details
        const property = await Properties.findById(rentPayment.lease.propertyId);
        const propertyName = property ? property.propertyName : "Unknown Property"; // Default if property not found

        // Create a notification for the landlord
        const notification = new Notification({
          userId: landlordId,
          title: "Rent Payment Received",
          description: `${tenantFullName} has paid ${amount} rent of ${monthName} for your property: ${propertyName}.`,
        });

        // Save the notification
        await notification.save();

        // Add console.log to confirm notification addition
        console.log(
          `Notification added for landlord (ID: ${landlordId}) regarding tenant: ${tenantFullName} for ${monthName} on property: ${propertyName}`
        );
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Continue without blocking the payment confirmation process
      }
    } else {
      rentPayment.paymentStatus = "failed"; // or set to 'pending' based on your use case
    }

    // Save the updated rent payment
    await rentPayment.save();

    // Respond with the updated payment status
    res.status(200).json({
      message: `Payment status updated to ${paymentStatus}`,
      rentPayment,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ message: "Error confirming payment" });
  }
};








// Controller to calculate pending payments for a tenant
exports.getPendingPayments = async (req, res) => {
  const { tenantId } = req.params;

  try {
    // Fetch active lease agreements for the tenant
    const leases = await LeaseAgreement.find({
      tenantId: tenantId,
      status: "Active",
    });

    if (!leases.length) {
      return res
        .status(404)
        .json({ message: "No active leases found for this tenant." });
    }

    const dueRentDetails = [];

    for (const lease of leases) {
      const {
        tenancyStartDate,
        tenancyEndDate,
        rent,
        _id: leaseId,
        landlordId,
      } = lease;

      // Fetch landlord details to get stripeAccountId
      const landlord = await User.findById(landlordId);
      if (!landlord) {
        return res.status(404).json({ message: "Landlord not found." });
      }

      const { stripeAccountId } = landlord;

      // Fetch completed payments for this lease and tenant
      const payments = await RentPayment.find({
        lease: leaseId,
        tenant: tenantId,
        paymentStatus: "completed",
      });

      // Create a set of paid months based on the month field in RentPayment
      const paidMonths = new Set(
        payments.map((payment) => payment.month) // Use the month field directly
      );

      // Calculate due months
      const currentDate = new Date();
      const start = new Date(tenancyStartDate);
      const end = new Date(Math.min(tenancyEndDate, currentDate)); // Consider up to the current date

      for (
        let date = new Date(start);
        date <= end;
        date.setMonth(date.getMonth() + 1)
      ) {
        const monthKey = date.toISOString().slice(0, 7); // Format: YYYY-MM

        // Only include months that have not been paid
        if (!paidMonths.has(monthKey)) {
          let dueAmount = rent;

          // Handle prorated rent for the first month
          if (
            date.getFullYear() === start.getFullYear() &&
            date.getMonth() === start.getMonth()
          ) {
            const daysInMonth = new Date(
              start.getFullYear(),
              start.getMonth() + 1,
              0
            ).getDate();
            const remainingDays = daysInMonth - start.getDate() + 1;
            dueAmount = ((rent / daysInMonth) * remainingDays).toFixed(2);
          }

          // Handle prorated rent for the last month
          if (
            date.getFullYear() === end.getFullYear() &&
            date.getMonth() === end.getMonth()
          ) {
            const daysInMonth = new Date(
              end.getFullYear(),
              end.getMonth() + 1,
              0
            ).getDate();
            const paidDays = end.getDate();
            dueAmount = ((rent / daysInMonth) * paidDays).toFixed(2);
          }

          // Add to dueRentDetails only unpaid months
          dueRentDetails.push({
            leaseId,
            propertyId: lease.propertyId,
            landlordId, // Include landlordId in the response
            stripeAccountId, // Include stripeAccountId in the response
            month: monthKey,
            dueAmount: parseFloat(dueAmount),
          });
        }
      }
    }

    return res.status(200).json(dueRentDetails);
  } catch (error) {
    console.error("Error calculating pending payments:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};




// Controller to get pending payments for a landlord
exports.getPendingPaymentsForLandlord = async (req, res) => {
  const { landlordId } = req.params;

  try {
    console.log(req.body);
    
    // Fetch active leases for the landlord
    const leases = await LeaseAgreement.find({
      landlordId: landlordId,
    });

    // Return a 200 OK with an empty array and message if no leases are found
    if (!leases.length) {
      return res.status(200).json({ message: "No active leases found for this landlord.", data: [] });
    }

    const pendingPayments = [];

    for (const lease of leases) {
      const {
        tenancyStartDate,
        tenancyEndDate,
        rent,
        _id: leaseId,
        tenantId,
        propertyId, // Assume this is the field storing property ID
      } = lease;

      // Fetch tenant details to get the Stripe Account ID (if needed for payment routing)
      const tenant = await User.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found." });
      }

      // Fetch the property details using the propertyId
      const property = await Properties.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found." });
      }

      // Fetch completed payments for this lease and tenant
      const payments = await RentPayment.find({
        lease: leaseId,
        tenant: tenantId,
        paymentStatus: "completed",
      });

      // Create a set of paid months based on the month field in RentPayment
      const paidMonths = new Set(
        payments.map((payment) => payment.month) // Use the month field directly
      );

      // Calculate due months
      const currentDate = new Date();
      const start = new Date(tenancyStartDate);
      const end = new Date(Math.min(tenancyEndDate, currentDate)); // Consider up to the current date

      for (
        let date = new Date(start);
        date <= end;
        date.setMonth(date.getMonth() + 1)
      ) {
        const monthKey = date.toISOString().slice(0, 7); // Format: YYYY-MM

        // Only include months that have not been paid
        if (!paidMonths.has(monthKey)) {
          let dueAmount = rent;

          // Handle prorated rent for the first month
          if (
            date.getFullYear() === start.getFullYear() &&
            date.getMonth() === start.getMonth()
          ) {
            const daysInMonth = new Date(
              start.getFullYear(),
              start.getMonth() + 1,
              0
            ).getDate();
            const remainingDays = daysInMonth - start.getDate() + 1;
            dueAmount = ((rent / daysInMonth) * remainingDays).toFixed(2);
          }

          // Handle prorated rent for the last month
          if (
            date.getFullYear() === end.getFullYear() &&
            date.getMonth() === end.getMonth()
          ) {
            const daysInMonth = new Date(
              end.getFullYear(),
              end.getMonth() + 1,
              0
            ).getDate();
            const paidDays = end.getDate();
            dueAmount = ((rent / daysInMonth) * paidDays).toFixed(2);
          }

          // Add to pending payments only unpaid months
          pendingPayments.push({
            leaseId,
            tenantId,
            month: monthKey,
            dueAmount: parseFloat(dueAmount),
            tenantName: `${tenant.firstName} ${tenant.lastName}`, // Include tenant name in the response
            tenantEmail: tenant.email, // Include tenant's email in the response
            propertyName: property.propertyName, // Include the property name in the response
          });
        }
      }
    }

    return res.status(200).json(pendingPayments);
  } catch (error) {
    console.error("Error calculating pending payments for landlord:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};


// Controller to get paid payments for a specific tenant
exports.getPaidPaymentsforTenant = async (req, res) => {
  try {
    const tenantId = req.params.tenantId; // Retrieve tenantId from request parameters

    // Check if tenantId is provided
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Find all completed payments for the tenant
    const paidPayments = await RentPayment.find({
      tenant: tenantId,
      paymentStatus: "completed",
    })
      .populate({
        path: "lease",
        select: "tenant landlord propertyId", // Only populate tenant, landlord, and propertyId
        populate: {
          path: "propertyId", // Populate propertyId field with full property object
          select: "location " // Choose the fields you want from the Property model
        }
      })
      .populate("landlord", "firstName lastName email") // Populate landlord info
      .select("amount paymentDate paymentIntentId lease"); // Select relevant fields

    if (paidPayments.length === 0) {
      return res
        .status(404)
        .json({ message: "No paid payments found for this tenant." });
    }

    // Return the list of paid payments, now with full property information
    return res.status(200).json(paidPayments);
  } catch (error) {
    console.error("Error fetching paid payments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Controller to get paid payments for a specific landlord
exports.getPaidPaymentsForLandlord = async (req, res) => {
  try {
    const landlordId = req.params.landlordId; // Retrieve landlordId from request parameters

    // Check if landlordId is provided
    if (!landlordId) {
      return res.status(400).json({ message: "Landlord ID is required" });
    }

    // Fetch completed rent payments for the landlord
    const paidPayments = await RentPayment.find({
      landlord: landlordId,
      paymentStatus: "completed",
    })
      .populate('tenant', 'firstName lastName email') // Optionally populate tenant details
      .populate({
        path: 'lease', // Populate lease details
        select: 'propertyId', // Only include propertyId
        populate: {
          path: 'propertyId', // Populate the property information
          select: 'location propertyname',// Select only the location of the property
        },
      })
     
      .exec();

    // Check if there are any paid payments and return the data
    if (paidPayments.length > 0) {
      return res.status(200).json(paidPayments);
    } else {
      return res.status(404).json({ message: "No paid payments found for this landlord." });
    }
  } catch (error) {
    console.error("Error fetching paid payments for landlord:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};
