const { generateToken } = require('../../config/jwtToken');
const UserSchema = require('../../models/user');
const UserSchmeaKey = require('../../utils/validation/userValidation');
const asyncHandler = require('express-async-handler');
const generateRefreshToken = require('../../config/refreshToken');
const jwt = require('jsonwebtoken');

/**
 * @description : user registration 
 * @access:public
 * @param {object} req:request for register
 * @param {object} res:response for register
 * @return {object} :response for register {status,message,data}
 */
const register = asyncHandler(async (req,res) => {
       const data =new UserSchema({
        ...req.body
       })
       let findUser = await UserSchema.findOne({
        email:data.email,
        mobileNo:data.mobileNo
       });
       if (!findUser){
            const result = await UserSchema.create(data);
            return res.json({
            status:200,
            message:"Account created successfully",
            data:result
            })
       }else{
        throw new Error("User Already Exists")
       }
        
});


/**
 * @description : user Login 
 * @access:public
 * @param {object} req:request for Login
 * @param {object} res:response for Login
 * @return {object} :response for Login {status,message,data}
 */

const login = asyncHandler(async (req,res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        throw new Error("Insufficient request parameters! username and password is required.")
    }
    const result = await UserSchema.findOne({email});
    if(!result){
        throw new Error('User not found');
    }
    else if(result && await result.isPasswordMatched(password)){
        const refreshToken = await generateRefreshToken(result.id);
        const updateUser = await UserSchema.findByIdAndUpdate(result.id,{
            refreshToken
        },{
            new:true
        });
       res.cookie('refreshToken',refreshToken,
        {
            httpOnly:true,
            maxAge:24*60*60*1000
        }
       );

       res.json({
        data:result,
        token:generateToken(result.id)
       })
    }else if(result.loginRetryLimit <= 3){
      

        const updateLoginRetryLimit = await UserSchema.findByIdAndUpdate(result.id,{
            $inc:{loginRetryLimit:1}
        },{
            new:true
        });
        throw new Error("Incorrect Password")
    }
    else{
        const now = new Date();
        const retryTime = new Date(now.getTime() + 2000);
        const updateLoginReactiveTime = await UserSchema.findByIdAndUpdate(
            result.id,{
                loginReactiveTime:retryTime
            }
        )
        res.json({
            message:`Many Attempts try after 2 mins`
        })
    }
});


/**
 * @description : user logout 
 * @access:public
 * @param {object} req:request for logout
 * @param {object} res:response for logout
 * @return {object} :response for logout {status,message}
 */

const logout = asyncHandler(async(req,res)=>{
   const cookie = req.cookies;
   const refreshToken = cookie.refreshToken;
   if(!cookie?.refreshToken){
    throw new Error('No Refresh Token in Cookies')
  }
  const user = await UserSchema.findOne({refreshToken});
  if(!user){
    res.clearCookie('refreshToken',
    {
        httpOnly:true,
        secure:true
    });
    return res.sendStatus(204);
 
  }
   await UserSchema.findOneAndUpdate({refreshToken},{
    refreshToken:''
    })
    res.clearCookie('refreshToken',
    {
        httpOnly:true,
        secure:true
    });
     res.json({
        message:'Logout successful'
     })
})

// handle refresh token
const handleRefreshToken = asyncHandler(async(req,res)=>{
  const cookie = req.cookies;
  if(!cookie?.refreshToken){
    throw new Error('No Refresh Token in Cookies')
  }
  const refreshToken = cookie.refreshToken;
  const user = await UserSchema.findOne({refreshToken});
  if(!user){
    throw new Error('Refresh Token not matched.')
  }
  const decoded = await jwt.verify(refreshToken, process.env.JWT_CLIENT_SECRET);
  if(!decoded || user.id !== decoded.id){
    throw new Error('Something went wrong')
  }
  const accessToken = generateToken(user.id);
  res.json({
    accessToken
  })

})


module.exports = {
    register,
    login,
    logout,
    handleRefreshToken
}