# CallmeStock — Multi-branch Reorder Planner

A front-end-only dashboard that helps a small multi-branch retailer decide what to move, what to buy, and what to postpone. It is built with plain HTML, Tailwind CSS, and JavaScript.

## About this project

This project was originally created to refresh my knowledge in programming and understand how Claude AI can help in developing a real application. It also served as my way to explore wider use of JavaScript in a front-end-only dashboard and understand its functions: state management, derived calculations, event handling, dynamic rendering, and browser storage, all without a framework.

## The question it answers

> **Across all my branches, which items will run out before new stock can arrive, and what is the cheapest way to fix that: moving stock between branches, buying from suppliers, or waiting, given a limited purchasing budget?**

Managing each branch on its own often leaves one branch with surplus stock while another sells out, and the shop then spends cash on new orders it did not need. StockWise looks at all branches together and turns the numbers into a plan.

## Features

- **Stock position table** for every item at every branch, with editable on hand, incoming, and sales per day values
- **Status flags**: Stockout risk, Reorder now, Overstock, or Healthy
- **Transfer suggestions** that move surplus from one branch to another before anything is bought
- **Purchase orders grouped by supplier**, rounded up to each supplier's minimum order quantity
- **Budget-aware funding**: the most urgent items are funded first, and the rest are listed as postponed with the extra budget they would need
- **Summary cards** for items at risk, funded spend, postponed lines, and cash sitting in surplus stock
- **Adjustable settings**: safety days, review period, and purchasing budget
- **CSV export** of the funded purchase orders
- **Saved in the browser** with `localStorage`, plus a button to reset the demo data

## How the plan is calculated

For each item at each branch:

| Value | Formula |
|---|---|
| Days of cover | on hand ÷ sales per day |
| Reorder point | sales per day × (lead time + safety days) |
| Target stock | sales per day × (lead time + safety days + review period) |
| Stock position | on hand + incoming |

Then, in order:

1. **Status.** Stockout risk if days of cover is less than the supplier lead time. Reorder now if the stock position is at or below the reorder point. Overstock if cover is above 60 days. Otherwise Healthy.
2. **Transfers.** A branch with more than 1.5× its target donates to branches that need a reorder, starting with the one with the least cover.
3. **Purchasing.** The remaining shortfall is summed per item and rounded up to a multiple of the minimum order quantity.
4. **Budget.** Purchase lines are sorted by urgency (lowest days of cover first) and funded until the budget is used up.

## Run it

No server or install is needed. Open `index.html` in a browser.

## Project structure

```text
stockwise/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    └── app.js
```

All logic lives in `js/app.js`: seed data, the `plan()` function that does the calculations, and the rendering and event handlers.

## Limitations

- Demand is a simple daily average. There is no seasonality, trend, or promotion forecasting.
- Items, suppliers, lead times, and minimum order quantities come from the demo data. The interface edits stock and sales figures, not the catalog.
- The 60-day overstock threshold and the 1.5× donor rule are fixed choices in the code, not settings.
- Transfers ignore shipping cost and time between branches.
- Data is saved only in this browser for this site. Clearing site data will erase your edits, and nothing is synced or backed up.
- The built-in data is made up for demonstration.

## Possible next steps

- Add and edit items, suppliers, and branches in the interface
- Import stock levels and sales history from CSV
- Estimate demand from sales history instead of typing it in
- Add transfer cost and travel time to the transfer logic
- Make the overstock threshold and donor rule adjustable