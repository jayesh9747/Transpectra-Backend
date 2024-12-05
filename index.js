// Importing necessary modules and packages
const express = require("express")
const app = express()
const database = require("./config/db")
const dotenv = require("dotenv")
const path = require("path")

const { CONFIG } = require('./constants/config')
const { auth } = require('./middleware/auth');
const forecastRoutes = require('./routes/stockForecast');

const { getCarbonEmission } = require('./UlipAPI/carbonEmissionapi')


// Setting up port number
const PORT = process.env.PORT || 4000

// Loading environment variables from .env file
dotenv.config()

// Connecting to database
database.connect()
const cookieParser = require("cookie-parser")
const cors = require("cors") //backend should entertain frontend's request 


const { cloudinaryConnect } = require("./config/cloudinary")
//const fileUpload = require("express-fileupload")

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(
    cors({
        origin: '*',
        credentials: true,
    })
);
// app.use(
//     fileUpload({
//         useTempFiles: true,
//         tempFileDir: "/uploads/",
//         limits: { fileSize: 20 * 1024 * 1024 },
//     })
// )
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Connecting to cloudinary
cloudinaryConnect()


// Importing Routes
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const DistributionStoreRoutes = require('./routes/DistributionCenter')
const storeRoutes = require('./routes/Store');
const driverRoutes = require('./routes/driver');
const warehouseRoutes = require('./routes/Warehouse')
const ManufacturingUnitRoutes = require('./routes/ManufacturingUnit')
const YardManage = require('./routes/YardManage')
const fleetRoutes = require('./routes/fleet')
const OrderRoutes = require('./routes/Order');
const DeliveryRoutes = require('./routes/delivery');
const inventoryRoutes = require('./routes/inventory');
const pdfRoutes = require('./routes/pdf');
// const OrderedProductsRoutes = require('./routes/OrderedProductsRoutes')
// const OrderRequestRoute = require('./routes/OrderRequestRoute')
const ManufacturerFetchRoute = require('./routes/Manufacturer')
const routeTracking = require('./routes/routeTracking')


app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running",
    })
})

app.get('/carbon', async (req, res) => {
    const result = await getCarbonEmission('1823.3', 100);

    console.log("this is result of ", result.data)

    return res.json({
        data: result
    })
})




// Routes
app.use(CONFIG.APIS.auth, userRoutes);
app.use(CONFIG.APIS.profile, profileRoutes);
app.use(CONFIG.APIS.distribution_center, auth, DistributionStoreRoutes);
app.use(CONFIG.APIS.store, auth, storeRoutes);
app.use(CONFIG.APIS.driver, driverRoutes);
app.use(CONFIG.APIS.warehouse, warehouseRoutes)
app.use(CONFIG.APIS.manufacturingUnit, ManufacturingUnitRoutes)
app.use(CONFIG.APIS.yard, YardManage)
app.use(CONFIG.APIS.fleet, fleetRoutes)
app.use(CONFIG.APIS.delivery, DeliveryRoutes);
// app.use(CONFIG.APIS.OrderedProducts, OrderedProductsRoutes)
// app.use(CONFIG.APIS.OrderRequest, OrderRequestRoute)
app.use(CONFIG.APIS.Order, OrderRoutes);
app.use(CONFIG.APIS.ManufacturerFetch, ManufacturerFetchRoute)
app.use(CONFIG.APIS.inventory, inventoryRoutes)

app.use(CONFIG.APIS.forecast, forecastRoutes);
app.use(CONFIG.APIS.routeTracking, routeTracking)
app.use(CONFIG.APIS.pdf, pdfRoutes)
// Listening to the server
app.listen(PORT, () => {
    console.log(`App is listening at ${PORT}`)
})
// End of code.