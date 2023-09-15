
import { Strategy } from 'passport-local';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import './db.mjs';

const User = mongoose.model('User');



export default (passport)=>{
    const verifyUser = async (username, password, done)=>{
        User.findOne({username: username})
        .then(async(user)=>{
            if(!user){
                return done(null, false,{message: 'User Does not exist'});
            }
            const isvalid = await bcrypt.compare(password, user.password);

            if(isvalid){
                return done(null, user);
            }
            else{
                return done(null, false);
            }

        })
        .catch((err)=>{
            done(err);
        });

    };
    passport.use(new Strategy(verifyUser));

    passport.serializeUser((user,done)=>{
        done(null,user.id);
    });

    passport.deserializeUser((userId, done)=>{
        User.findById(userId)
        .then((user)=>{
            done(null, user);
        })
        .catch(err => done(err));
    });

};



