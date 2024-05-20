export const PLANS = [
    {
        name: "Free",
        slug: "free",
        quota: 10,
        pagesPerPdf: 10,
        price: {
            amount: 0,
            priceIds: {
                test: "",
                production: ""
            }
        }
    },
    {
        name: "Pro",
        slug: "pro-hour",
        quota: 500,
        pagesPerPdf: 10000000,
        price: {
            amount: 5,
            priceIds: {
                test: "ssafsa", //// put the pricing key from stripe
                production: ""
            }
        }
    },
    {
        name: "Pro",
        slug: "pro-day",
        quota: 500,
        pagesPerPdf: 10000000,
        price: {
            amount: 20,
            priceIds: {
                test: "ssafsa", //// put the pricing key from stripe
                production: ""
            }
        }
    },
    {
        name: "Pro",
        slug: "pro-week",
        quota: 500,
        pagesPerPdf: 10000000,
        price: {
            amount: 50,
            priceIds: {
                test: "ssafsa", //// put the pricing key from stripe
                production: ""
            }
        }
    },
]