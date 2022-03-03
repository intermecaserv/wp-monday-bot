import { config } from 'dotenv';

config({
    debug: process.env.NODE_ENV === 'dev'
});
console.log(process.env.NODE_ENV);