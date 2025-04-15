import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalytics = async(req,res)=>{
    try {
        const analyticsData = await getAnalyticsData();

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7*24*60*60*1000);

        const dailySalesData = await getDailySalesData(startDate,endDate);

        res.json({
            analyticsData,
            dailySalesData
        })
    } catch (error) {
        console.log("Error in analytics route", error.message);
        res.status(500).json({message:"Server error", error: error.message});
    }
}

//all are functions
async function getAnalyticsData(){
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group:{
                _id:null,
                totalSales:{ $sum:1 },
                totalRevenue:{ $sum: "$totalAmount" },
            }
        }
    ])

    const {totalSales, totalRevenue } = salesData[0] || {totalSales:0, totalRevenue:0 }

    return {
        users:totalUsers,
        products: totalProducts,
        totalSales,
        totalRevenue,
    }
}

async function getDailySalesData(startDate,endDate){
   try {
    const dailySalesData = await Order.aggregate([
        {
            $match:{
                createdAt:{
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group:{
                _id:{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                sales: { $sum: 1 },
                revenue: { $sum: "$totalAmount"},
            }
        },
        { $sort: { _id: 1 }},
    ])

    const datesArray = getDatesInRange(startDate,endDate);

    return datesArray.map(date => {
        const foundData = dailySalesData.find(item => item._id === date);

        return {
            date,
            sales: foundData?.sales || 0,
            revenue: foundData?.revenue || 0,
        }
    })
   } catch (error) {
    throw error;
   }
}

function getDatesInRange(startDate,endDate) {
    const dates=[];
    let currentDate = new Date(startDate);

    while(currentDate<= endDate){
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}