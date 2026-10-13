require('dotenv').config();const express=require('express');const cors=require('cors');const db=require('./config/db');const errors=require('./middleware/errors');const app=express();const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8081',
  'http://127.0.0.1:8081'
]);
app.use(cors({origin(origin,callback){if(!origin||allowedOrigins.has(origin))return callback(null,true);callback(new Error('Not allowed by CORS'));}}));app.use(express.json({limit:'1mb'}));

app.get('/api/health',async(req,res)=>{try{await db.query('SELECT 1');res.json({status:'ok',database:'connected'});}catch{res.status(503).json({status:'error',database:'disconnected'});}});

app.use('/api/auth',require('./routes/auth'));
app.use('/api/products',require('./routes/products'));

const resources=require('./routes/resources');
app.use('/api/categories',resources.categories);
app.use('/api/suppliers',resources.suppliers);
app.use('/api/stock',require('./routes/stock'));
app.use('/api/dashboard',require('./routes/dashboard'));
app.use(errors);
const port=process.env.PORT||5000;app.listen(port,()=>console.log(`Inventory API running at http://localhost:${port}`));
