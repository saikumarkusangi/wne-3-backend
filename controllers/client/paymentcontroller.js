import stripe from stripe(process.env.STRIPE_SECRET)
import dotenv from dotenv;
import asyncHandler from 'express-async-handler';
dotenv.config();
const publish=process.env.STRIPE_PUB;

export const pay=asyncHandler(async(req,res)=>{
   
    try {
        res.render("payment",{
            key:publish
        })
    } catch (error) {
        res.status(505).send("payment page doesnt exist")
    }
  
})

export const customerpay=asyncHandler(async(req,res)=>{
   try {
    stripe.customer.create({
        email:req.body.StripeEmail,
        source:req.body.StripeSource,
        name:req.body.StripeName,
        address:{
            line1:"",
            postal_code:'1112',
            city:'new delhi',
            state:'delhi',
            country:'india'
        }
       })
       .then((customer) => {
        
        return stripe.charges.create({
            amount:"",
            description:"",
            currency:"INR",
            customer:"test"
        })


        .then((charge) => {
            res.status(200).send("payment sucess")

        }).catch((err) => {
         
            if(err)throw err;
            res.status(505).send("payment not done")

            
        });

       })
       
       
   } catch (error) {

    if(err)throw err;
    
   }
})

export default{
    pay,
    customerpay
};


