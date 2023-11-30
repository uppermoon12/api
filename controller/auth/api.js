import {createUsers,findUsers,usernameCheck,emailCheck} from '../../models/function/users.js'
import jwt  from "jsonwebtoken";
import nodemailer from 'nodemailer'
import {transporter, sendVerif} from '../../middleware/email.js'
import { nanoid } from 'nanoid';


export const login = async(req,res)=>{
    try {
        const {username, password} = req.body
        const user = await findUsers(username,password);
        if(user){
            const token = jwt.sign({username},process.env.JWT_TOKEN,{expiresIn: '1d'})
            return res.cookie('token',token,{
                httpOnly: true,
                maxAge: 24*24*24*1000,
                secure: true,
            }).status(202).json({
                status: 'success',
                message: 'login succed!',
                result:{
                    id: user.id,
                    username : user.username,
                    token : token,
                }
            })
        }
        return res.status(402).json({
            status: 'fail',
            message: 'user not found!'
        })
    } catch (error) {
        console.error(`error`,error)
        throw error
    }
}

export const register = async(req,res)=>{
    try {
        const {username, email,password,confirmPassword} = req.body
        const id = `users_${nanoid(20)}`
            const dataStorage = {
                id,
                username,
                email,
                password,
                confirmPassword
            };
            console.log(process.env.EMAIL)
            const data = await jwt.sign({dataStorage},process.env.JWT_TOKEN,{expiresIn: '120s'});
            res.cookie('data',data),{
                httpOnly: true,
                maxAge: 120000,
                secure: true,
            }
            const checkUsername = await usernameCheck(username);
            const checkEmail = await emailCheck(email)
                if(checkUsername.length > 0 ||checkEmail.length > 0){
                    return res.status(400).json({
                        status: 'fail',
                        message: 'username / email already used!'
                    
                    });
                } 
            
            if(password !== confirmPassword){
                return res.status(400).json({
                    status: 'fail',
                    message: 'Password & confirm Password not match!'
                });
            }
            console.log(`http://localhost:2000/api/verify/?id=${id}&token=${data}`)
            transporter.sendMail(await sendVerif(email,id,data),(error,info)=>{
                if(error){
                    console.log(`error sending email:`, error);
                    return res.status(500).json({
                        status: 'fail',
                        message: error
                    })
                }
                return console.log('message sent : %s', info.messageId);
            });
            return res.status(200).json({
                status: 'success',
                message: 'link has sent!'
            })
    } catch (error) {
        console.error(`error ${error}`);
        throw error
    }
}


export const verify = async (req,res)=>{
    try {
        const cookie = req.cookies
        const {id,token} = req.query
        console.log(id)
        if(!cookie.data && !cookie.token){
            return res.status(404).json({
                status: 'fail',
                message: 'u not allowed!'
            })
        }
        const data = cookie.data
        await jwt.verify(data,process.env.JWT_TOKEN, async(err,decoded)=>{
            if(err){
                return res.status(404).json({
                    status: 'fail',
                    message: err
                })
            }
            const userData = decoded.dataStorage
            console.log(userData.id)
            if(id !== userData.id || token !== data){
                return res.status(404).json({
                    status: 'fail',
                    message: 'user not found!'
                })
        }
        createUsers(
            userData.id,
            userData.username,
            userData.email,
            userData.password)
            return res.status(202).json({
                status:'success',
                result:{
                    id : userData.id,
                    username : userData.username,
                    email : userData.id,
                }
            })
        })
        // res.remove(data)
    } catch (error) {
        console.error(`error ${error}`);
        throw error
    }

}