/*require('dotenv').config();
const express =require('express');
const cors =require('cors');
const helmet =require('helmet');
const morgan =require('morgan');

const authRoutes = require('./routes/authRoutes');
const { timeStamp } = require('node:console');


const app =express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

//Rutas
app.use('/auth', authRoutes);

//health check

app.get('/health',(req,res)=>{
    res.json({status:'OK', service:'auth-service', timeStamp: new Date().toISOString()});
});

//manejo de los errores

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({error: 'Algo salio mal! Vuelva a intentarlo mas tarde'});
});

app.listen(PORT, ()=>{
    console.log('Auth service esta corriendo en el puesto${PORT}');
});*/