require("dotenv").config();

const CONFIG = {
    DB: {
        DB_HOST: process.env.MONGODB_URL,
        DB_NAME: process.env.DB_NAME,
    },
    HOST: {
        web: process.env.CLIENT,
        android: process.env.CREATION_PORTAL_URL,
    },
    APIS: {
        auth: "/api/v1/auth",
        profile: "/api/v1/profile",
        inventory: "/api/v1/inventory",
        qr_code: "/api/v1/qr",
        delivery: '/api/v1/delivery',
        trailer: '/api/v1/trailer',
        route: '/api/v1/route',
        distribution_center: '/api/v1/distribution-center',
        store: '/api/v1/store',
        driver: '/api/v1/driver',
        warehouse: '/api/v1/warehouse',
        manufacturingUnit: '/api/v1/manufacturingunit',
        yard: '/api/v1/yard',
        fleet: '/api/v1/fleet',
        Order: "/api/v1/order",
        ManufacturerFetch: '/api/v1/manufacturer',
        forecast: '/api/v1/forecast',
        routeTracking: '/api/v1/routeTracking',
        //routeOptimi:'api/v1/route',
        pdf:'/api/v1/pdf',
    },
    KEYS: {
        CLOUDINARY: {
            CLOUD_NAME: process.env.CLOUD_NAME,
            API_KEY: process.env.CLOUDINARY_API_KEY,
            API_SECRET: process.env.CLOUDINARY_API_SECRET
        },
        NODEMAILER: {
            MAIL_HOST: process.env.MAIL_HOST,
            MAIL_USER: process.env.MAIL_USER,
            HOST_PASS: process.env.MAIL_PASS
        }

    },
    JWT: {
        TOKEN: process.env.JWT_SECRET
    },
    ACCOUNT_TYPE: {
        STORE: "Warehouse_Manager",
        DISTRIBUTION_CENTER: "Supplier",
        DRIVER: "Driver",
        YARD: "Yard_managers"
    },
    STORE_TYPE: {
        STORE: "Store",
        DISTRIBUTION_CENTER: "Distribution Center"
    },
    ULIP: {
        url: process.env.ULIP_PORTAL,
        username: process.env.ULIP_USERNAME,
        password: process.env.ULIP_PASSWORD
    },
    ULIP_API: {
        CARBON_EMISSION: process.env.CARBON_EMISSION_URL,
        EWAY_BILL : process.env.EWAY_BILL_URL,
        SARTHI : process.env.SARTHI_URL,
        VAHAN : process.env.VAHAN_URL,
    },
    GEOAPIFY :{
        BASE_URL : process.env.GEOAPIFY_BASE_URL,
        API_KEY : process.env.GEOAPIFY_API_KEY
    },
    GEOAPIFY_ROUTES:{
         
    },
    DJANGO_URL: process.env.DJANGO_SERVER_URL
};

module.exports = {
    CONFIG,
};
