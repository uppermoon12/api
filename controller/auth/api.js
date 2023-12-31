import {createUsers,findUsers,usernameCheck,emailCheck, findUsername, updatePassword} from '../../models/function/users.js'
import jwt  from "jsonwebtoken";
import nodemailer from 'nodemailer'
import {transporter, sendVerif} from '../../middleware/email.js'
import { nanoid } from 'nanoid';
import usersTable from '../../models/table/usersModel.js';
import noteTables from '../../models/table/noteTables.js';

// Login function
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
                sameSite: 'none',
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
        // if user not found!
        return res.status(402).json({
            status: 'fail',
            message: 'user not found!'
        })
    } catch (error) {
        console.error(`error`,error)
        throw error
    }
}

// register function
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
                message: 'link has sent!',
                result: {
                    dataToken : data
                }
            })
    } catch (error) {
        console.error(`error ${error}`);
        throw error
    }
}


export const verify = async (req,res)=>{
    try {
        const {id,token} = req.query
        jwt.verify(token,process.env.JWT_TOKEN, async(err,decoded)=>{
            if(err){
                return res.status(404).json({
                    status: 'fail',
                    message: err
                })
            }
            const userData = decoded.dataStorage
            const verify = 'true'
            if(id !== userData.id || !token){
                return res.status(404).json({
                    status: 'fail',
                    message: 'user not found!'
                })
        }
        createUsers(
            userData.id,
            userData.username,
            userData.email,
            userData.password,
            verify,
            )
            return res.status(202).redirect('https://todo-client-mqxn4q5g2q-as.a.run.app/verify/success')   
        })
    } catch (error) {
        console.error(`error ${error}`);
        throw error
    }

}

export const deleteUser = async(req,res)=>{
    const cookie = await req.cookies
    const token = cookie.token
    if(!token){
        return res.status(404).json({
            status: 'fail',
            message: 'you must login first!'
        })
    }
    try {
        await jwt.verify(token,process.env.JWT_TOKEN, async(error,decoded)=>{
            if(error){
                return res.status(404).json({
                    status: 'fail',
                    message: 'error',error
                })
            }
            const username = decoded.username
            const user = await findUsername(username)
            if(user){
                const id = user.id
                await usersTable.destroy({where:{username}});
                await noteTables.destroy({where:{id}});
                return res.status(200)
                .json({
                    status: 'success',
                    message: 'delete'
                })
            }else{
                return res.status(404).json({
                    status: 'fail',
                    message: 'user not found!'
                })
            }
        })
    } catch (error) {
        console.error(error)
        throw error
     }
}

export const logout = async(req,res)=>{
    try {
        
    } catch (error) {
        
    }

}

export const sendingVerifCode = async (req,res)=>{
    try {
        const email = req.body.email
        const user = await emailCheck(email)
        const verificationCode = nanoid(5)
        if(user){
            const forgetPassword = jwt.sign({email,verificationCode},process.env.JWT_TOKEN,{expiresIn: '120s'})
            res.cookie('forgetPassword',forgetPassword),{
                httpOnly: true,
                maxAge: 120000,
                secure: true,
            }
            transporter.MailMessage(await sendVerif(email,verificationCode),(error,info)=>{
                if(error){
                    console.log(`error sending email:`, error);
                    return res.status(500).json({
                        status: 'fail',
                        message: error
                    })
                }
                return console.log('message sent : %s', info.messageId);
            })
            return res.status(200).json({
                status: 'success',
                message: 'verif code has sent!'

            })
        }
    } catch (error) {
        console.error(`error ${error}`);
    }
}

const resetPassword = async(req,res)=>{
    try {
        const {code,resetPassword,confirmPassword} = req.body
        const cookie = await res.cookies
        const forgetPassword = cookie.forgetPassword
        if(!forgetPassword){
            return res.status(404).json({
                status: 'fail',
                message: 'you must send email first!'
            })
        }
        jwt.verify(forgetPassword,process.env.JWT_TOKEN, async(error,decoded)=>{
            if(error){
                return res.status(404).json({
                    status: 'fail',
                    message: 'error',error
                })
            }
            const email = decoded.email
            const verificationCode = decoded.verificationCode
            const searchUser = await emailCheck(email)

            if(searchUser){
                if(code !== verificationCode){
                    return res.status(400).json({
                        status: 'fail',
                        message: 'code not match!'
                    })
                }
                if(resetPassword !== confirmPassword){
                    return res.status(400).json({
                        status: 'fail',
                        message: 'password not match!'
                    })
                }
                return await updatePassword(email,resetPassword)
            }
        })
    } catch (error) {
        return console.error('error',error)
    }
}