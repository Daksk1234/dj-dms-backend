const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const PChallan = require("../models/PChallan");
const SChallan = require("../models/SChallan");
const Receipt = require("../models/Receipt");
const Payment = require("../models/Payment");

const ObjectId = mongoose.Types.ObjectId;

// Closing Stock Report Route
router.get("/closing-stock/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  if (!ObjectId.isValid(superAdminId)) {
    return res.status(400).json({ error: "Invalid SuperAdmin ID" });
  }

  try {
    const products = await Product.find({ superAdminId });
    const formatNumber = (value) => Number(value || 0).toFixed(2);

    const report = await Promise.all(
      products.map(async (product) => {
        const productName = product.productName;
        const openingQty = product.openingQuantity || 0;
        const openingRate = formatNumber(product.purchaseRate) || 0;
        const openingTotal = openingQty * openingRate;

        // ------------------ INWARD STOCK ------------------
        const inwardData = await PChallan.aggregate([
          {
            $match: {
              superAdminId: new ObjectId(superAdminId),
              "items.product": productName,
            },
          },
          { $unwind: "$items" },
          { $match: { "items.product": productName } },
          {
            $group: {
              _id: null,
              totalQty: { $sum: "$items.quantity" },
              avgRate: { $avg: "$items.price" },
            },
          },
        ]);

        const inwardQty = inwardData[0]?.totalQty || 0;
        const inwardRate = formatNumber(inwardData[0]?.avgRate) || 0;
        const inwardTotal = inwardQty * inwardRate;

        // ------------------ OUTWARD STOCK ------------------
        const outwardData = await SChallan.aggregate([
          {
            $match: {
              superAdminId: new ObjectId(superAdminId),
              "items.product": productName,
            },
          },
          { $unwind: "$items" },
          {
            $match: {
              "items.product": productName,
              "items.price": { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: null,
              totalQty: { $sum: "$items.quantity" },
              totalValue: {
                $sum: { $multiply: ["$items.quantity", "$items.price"] },
              },
            },
          },
        ]);

        const outwardQty = outwardData[0]?.totalQty || 0;
        const outwardRate =
          outwardQty > 0 ? outwardData[0].totalValue / outwardQty : 0;
        const outwardTotal = outwardQty * outwardRate;

        // ------------------ CLOSING STOCK ------------------
        const closingQty = openingQty + inwardQty - outwardQty;
        const closingRate =
          closingQty > 0
            ? formatNumber(
                (openingTotal + inwardTotal) / (openingQty + inwardQty)
              )
            : 0;

        const closingTotal = closingQty * closingRate;

        return {
          productName,
          openingQty,
          openingRate,
          openingTotal,

          inwardQty,
          inwardRate,
          inwardTotal,

          outwardQty,
          outwardRate,
          outwardTotal,

          closingQty,
          closingRate,
          closingTotal,
        };
      })
    );

    res.json(report);
  } catch (err) {
    console.error("Error generating closing stock report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.put("/closing-stock/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;
  if (!ObjectId.isValid(superAdminId)) {
    return res.status(400).json({ error: "Invalid SuperAdmin ID" });
  }

  try {
    // 1) load all products under this admin
    const products = await Product.find({ superAdminId });

    // 2) for each product, compute total inward via PChallan
    for (const product of products) {
      const productName = product.productName;

      // aggregate sum of all quantities for this product
      const inwardData = await PChallan.aggregate([
        {
          $match: {
            superAdminId: new ObjectId(superAdminId),
            "items.product": productName,
          },
        },
        { $unwind: "$items" },
        { $match: { "items.product": productName } },
        {
          $group: {
            _id: null,
            totalQty: { $sum: "$items.quantity" },
          },
        },
      ]);

      const inwardQty = inwardData[0]?.totalQty || 0;

      // 3) Persist that new inwardQty back onto the product doc
      await Product.updateOne(
        { _id: product._id },
        { $set: { inwardQuantity: inwardQty } }
      );
    }

    return res.json({ message: "Inward quantities updated for all products." });
  } catch (err) {
    console.error("Error updating inward quantities:", err);
    return res
      .status(500)
      .json({ error: "Failed to update inward quantities" });
  }
});

router.get("/sales-report/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await SChallan.find({ superAdminId });

    const formatted = challans.map((challan) => {
      return {
        challanNumber: challan.challanNumber,
        partyName: challan.customer,
        date: challan.date?.toISOString().split("T")[0] || "",
        products: challan.items.map((item) => ({
          name: item.product ?? [],
          quantity: item.quantity ?? [],
          rate: item.price ?? [],
          total: item.quantity * item.price ?? [],
        })),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Sales report fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sales report" });
  }
});

router.get("/purchase-report/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await PChallan.find({ superAdminId });

    const formatted = challans.map((challan) => {
      return {
        challanNumber: challan.challanNumber,
        partyName: challan.customer,
        date: challan.date?.toISOString().split("T")[0] || "",
        products: challan.items.map((item) => ({
          name: item.product,
          quantity: item.quantity,
          rate: item.price,
          total: item.quantity * item.price,
        })),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Sales report fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sales report" });
  }
});

router.get("/product-sales/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await SChallan.find({ superAdminId });

    const productWiseData = [];

    challans.forEach((challan) => {
      const date = challan.date?.toISOString().split("T")[0] || "";
      const challanNumber = challan.challanNumber;
      const partyName = challan.customer;

      challan.items.forEach((item) => {
        productWiseData.push({
          productName: item.product,
          quantity: item.quantity,
          rate: item.price,
          total: item.quantity * item.price,
          date,
          challanNumber,
          partyName,
        });
      });
    });

    productWiseData.sort((a, b) => a.productName.localeCompare(b.productName));
    res.json(productWiseData);
  } catch (err) {
    console.error("Product-wise sales report error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch product-wise sales report" });
  }
});

router.get("/product-purchase/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const challans = await PChallan.find({ superAdminId });

    const productWiseData = [];

    challans.forEach((challan) => {
      const date = challan.date?.toISOString().split("T")[0] || "";
      const challanNumber = challan.challanNumber;
      const partyName = challan.customer;

      challan.items.forEach((item) => {
        productWiseData.push({
          productName: item.product,
          quantity: item.quantity,
          rate: item.price,
          total: item.quantity * item.price,
          date,
          challanNumber,
          partyName,
        });
      });
    });

    productWiseData.sort((a, b) => a.productName.localeCompare(b.productName));
    res.json(productWiseData);
  } catch (err) {
    console.error("Product-wise sales report error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch product-wise sales report" });
  }
});

router.get("/balance/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    // Fetch all transactions
    const [sales, purchases, receipts, payments] = await Promise.all([
      SChallan.find({ superAdminId }).lean(),
      PChallan.find({ superAdminId }).lean(),
      Receipt.find({ superAdminId }).lean(),
      Payment.find({ superAdminId }).lean(),
    ]);

    // Map to party-wise balances
    const balanceMap = {};

    const addToMap = (partyName, type, amount) => {
      if (!balanceMap[partyName]) {
        balanceMap[partyName] = { debit: 0, credit: 0 };
      }
      if (type === "debit") {
        balanceMap[partyName].debit += amount;
      } else {
        balanceMap[partyName].credit += amount;
      }
    };

    sales.forEach((entry) => addToMap(entry.customer, "credit", entry.total));
    purchases.forEach((entry) =>
      addToMap(entry.customer, "debit", entry.total)
    );
    receipts.forEach((entry) =>
      addToMap(entry.partyName, "credit", -entry.amount)
    );
    payments.forEach((entry) =>
      addToMap(entry.partyName, "debit", -entry.amount)
    );

    // Calculate closing balances
    const balances = Object.entries(balanceMap).map(([partyName, values]) => {
      const { debit, credit } = values;
      const diff = Math.abs(debit - credit);
      return {
        partyName,
        debit: debit > credit ? diff : 0,
        credit: credit > debit ? diff : 0,
      };
    });

    res.json(balances);
  } catch (err) {
    console.error("Error fetching balance report:", err);
    res.status(500).json({ message: "Failed to fetch balance report" });
  }
});

router.get("/price-list/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;
  try {
    const products = await Product.find({ superAdminId });

    const challans = await PChallan.find({ superAdminId });

    const response = products.map((product) => {
      const items = challans.flatMap((c) => c.items);
      const related = items.filter(
        (i) =>
          i.product?.trim().toLowerCase() ===
          product.productName?.trim().toLowerCase()
      );

      const total = related.reduce((sum, i) => sum + i.price, 0);
      const avg = related.length > 0 ? total / related.length : 0;

      return {
        _id: product._id,
        productName: product.productName,
        minSalePrice: product.minSalePrice || "",
        profitPercent: product.profitPercent || "",
        avgPurchaseRate: avg.toFixed(2),
      };
    });

    res.json(response);
  } catch (err) {
    console.error("Failed to fetch price list:", err);
    res.status(500).json({ error: "Failed to fetch price list" });
  }
});

router.get("/profit-loss/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const sales = await SChallan.find({ superAdminId });
    const purchases = await PChallan.find({ superAdminId });
    const receipts = await Receipt.find({ superAdminId });
    const payments = await Payment.find({ superAdminId });

    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalPurchases = purchases.reduce(
      (sum, p) => sum + (p.total || 0),
      0
    );
    const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalIncome = totalSales + totalReceipts;
    const totalExpense = totalPurchases + totalPayments;
    const net = totalIncome - totalExpense;

    res.json({
      totalSales: totalSales.toFixed(2),
      totalReceipts: totalReceipts.toFixed(2),
      totalPurchases: totalPurchases.toFixed(2),
      totalPayments: totalPayments.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      netProfit: net >= 0 ? net.toFixed(2) : null,
      netLoss: net < 0 ? Math.abs(net).toFixed(2) : null,
    });
  } catch (err) {
    console.error("❌ Profit & Loss API failed:", err);
    res.status(500).json({ error: "Failed to generate P&L report" });
  }
});

router.get("/financials/:superAdminId", async (req, res) => {
  const { superAdminId } = req.params;

  try {
    // 1. Opening stock total from products
    const products = await Product.find({ superAdminId });
    const openingStock = products.reduce(
      (acc, p) => acc + p.openingQuantity * p.purchaseRate,
      0
    );

    // 2. Closing stock: derived from stock report if you store it, else calculate (simplified here)
    const closingStock = products.reduce(
      (acc, p) => acc + (p.closingQty * p.purchaseRate || 0),
      0
    );

    // 3. Purchase value
    const purchases = await PChallan.find({ superAdminId });
    const purchaseTotal = purchases.reduce((sum, pc) => sum + pc.total, 0);

    // 4. Sales value
    const sales = await SChallan.find({ superAdminId });
    const salesTotal = sales.reduce((sum, sc) => sum + sc.total, 0);

    // 5. Direct Expenses — assume payments with type = "direct"
    const directExpensesList = await Payment.find({
      superAdminId,
      paymentType: "direct",
    });
    const directExpenses = directExpensesList.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // 6. Indirect Expenses — paymentType: 'expense'
    const indirectExpensesList = await Payment.find({
      superAdminId,
      paymentType: "expense",
    });
    const indirectExpenses = indirectExpensesList.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // 7. Indirect Incomes — receipts marked as type: 'income'
    const indirectIncomesList = await Receipt.find({
      superAdminId,
      paymentType: "income",
    });
    const indirectIncomes = indirectIncomesList.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    // 8. Net calculations
    const grossProfit =
      salesTotal +
      closingStock -
      (openingStock + purchaseTotal + directExpenses);
    const netProfit = grossProfit + indirectIncomes - indirectExpenses;

    // Placeholder balance sheet values — you can replace these with your own collections or logic
    const capital = 100000;
    const drawings = 20000;
    const creditors = 30000;
    const outstandingExpenses = 5000;
    const loans = 40000;
    const fixedAssets = 80000;
    const currentAssets = 20000;
    const debtors = 25000;
    const cashBank = 15000;

    const totalLiabilities =
      capital + netProfit - drawings + creditors + outstandingExpenses + loans;
    const totalAssets =
      fixedAssets + currentAssets + closingStock + debtors + cashBank;

    res.json({
      openingStock,
      closingStock,
      purchaseTotal,
      salesTotal,
      directExpenses,
      indirectExpenses,
      indirectIncomes,
      grossProfit,
      netProfit,
      capital,
      drawings,
      creditors,
      outstandingExpenses,
      loans,
      fixedAssets,
      currentAssets,
      debtors,
      cashBank,
      totalLiabilities,
      totalAssets,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch financial data", details: err.message });
  }
});

module.exports = router;

module.exports = router;
