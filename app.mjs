import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import './db.mjs';
import {timeToString, genSchedule, timeToInt} from './algorithmfuncs.mjs';

/*
TODO
- add form for favoriting user schedules
- bootstrap
- deploy on somewehr
*/
import bcrypt from 'bcryptjs';// to encrypt password
import sanitize from 'mongo-sanitize'; // to sanatize user input before storin in database
import session from 'express-session';// for passport to save user 

//passports
import passport from 'passport';
 
import passportConfig from "./passport-config.mjs";

passportConfig(passport);


const Course = mongoose.model('Course');
const User = mongoose.model('User');
const Schedule = mongoose.model('Schedule');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'hbs');

app.use(session({
    secret: "catdoganimalsecret",
    resave: false,
    saveUninitialized: true,
}));

//passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req,res)=>{
    res.render('home', {user: req.user});
});
app.get('/home',(req,res)=>{
    res.redirect('/');
});

//put login and registration
app.get('/login', (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect('/');
    }
    res.render('login');
});

app.post('/login', passport.authenticate('local', {failureRedirect: '/login',successRedirect:'/home'}));

app.get('/register',(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect('/');
    }
    res.render('register');
});
//register a user 
app.post('/register',async (req,res)=>{
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const email = sanitize(req.body.email);
    try {
        //implemented registration
        const posUsr = await User.findOne({username: username});
        if(posUsr !== null){
          res.render('register', {message: 'Username already exist. Please try again.'});
        }
        else{
          const salt = await bcrypt.genSalt();
          const hash = await bcrypt.hash(password, salt);
          const newUser = new User({
            username: username,
            password: hash,
            email: email,
          }); 
          await newUser.save();
          res.redirect('/login');
    
        }
    
      } catch (err) {
        if(err instanceof mongoose.Error.ValidationError) {
          res.render('register', {message: err.message});
        } else {
          throw err;
        }
      }

    
});
//logout

app.get('/logout', (req,res,next)=>{
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        res.redirect('/');
      });

});

//adding a course to user courses
app.get('/course/add', (req,res)=>{
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    res.render('addCourse', {user: req.user});
});

app.post('/course/add', async (req,res)=>{
    const courseNum = req.body.courseNumber;
    const courseName = req.body.courseName;
    const year = req.body.year;
    const sem = req.body.semester;
    const prof = req.body.professor;

    let startTimeString = req.body.startTime;
    const startTime = timeToInt(startTimeString);
    startTimeString = timeToString(startTimeString);

    let endTimeString = req.body.endTime;
    const endTime = timeToInt(endTimeString);
    endTimeString = timeToString(endTimeString);

    const days = [];
    let daysString = '';
    if(req.body.monday!== undefined){
        days.push('Mon');
    }
    if(req.body.tuesday!== undefined){
        days.push('Tue');
    }
    if(req.body.wednesday!== undefined){
        days.push('Wed');
    }
    if(req.body.thursday!== undefined){
        days.push('Thu');
    }
    if(req.body.friday!== undefined){
        days.push('Fri');
    }
    for(let i=0; i<days.length; i++){
        daysString += days[i];
        if(days.length>1 && i!== days.length-1){
            daysString+=', ';
        }
    }

    const newCourse = new Course({
        courseName: courseName,
        courseNumber: courseNum,
        year: year,
        semester: sem,
        professor: prof,
        days: days,
        daysString: daysString,
        start: startTime,
        startString: startTimeString,
        end: endTime,
        endString: endTimeString
       
    });
    await newCourse.save();

    const theUser = await User.findOne({username: req.user.username});
    theUser.classes.push(newCourse);
    await theUser.save();

    

    res.redirect('/course/add');

});

app.get('/course/all', async (req,res)=>{
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        const theUser = await User.findOne({username: req.user.username});
        const classes = theUser.classes;

        const courses = await Course.find({
            '_id': { $in: classes} 
        });
        
        res.render('coursesAll', {course: courses, user: req.user});
    }
});

app.get('/schedule/generate', async (req,res)=>{
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        const theUser = await User.findOne({username: req.user.username});
        const classes = theUser.classes;
        const courses = await Course.find({
            '_id': { $in: classes} 
        });
        res.render('generateSchedule', {course: courses, user: req.user});
    }
});

app.post('/schedule/generate', async (req,res)=>{
    const theUser = await User.findOne({username: req.user.username});
    const classesID = theUser.classes;
    const choicesNames = req.body.courses;//
    const userCourses = await Course.find({
            '_id': { $in: classesID} 
        });

    const choices = userCourses.filter(course=>{
        const hasname = choicesNames.includes(course.courseName); 
        return hasname;
    });
    const generated = genSchedule(choices);
    if(generated === -1){
        res.redirect('/schedule/generate');
    }
    else{
        const checkIfExists = await Schedule.findOne({schedule: generated});
        if(checkIfExists){
        res.redirect('/schedule/generate');
        }
        const sched = new Schedule({
            schedule: generated
        });
        await sched.save();
        res.render('schedulesAll', {schedule: sched.schedule, _id: sched._id, user: req.user});

    }

    
});

//after generating a schedyle a user can favorite it
app.post('/schedules/favorite',async (req,res)=>{
    const user = await User.findOne({username: req.user.username});
    const newsched = await Schedule.findOne({_id: req.body.schedId});
    user.schedules.push(newsched);
    await user.save();
    
    res.redirect('/schedules/favorite');
});


//favorite page
app.get('/schedules/favorite',async (req,res)=>{
    if(!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        const user = await User.findOne({username: req.user.username});
        const schedulesID = user.schedules;
        const schedules = [];
        if(schedulesID.length>0){
            for(let i=0; i<schedulesID.length;i++){
                const currentSched = await Schedule.findOne({_id: schedulesID[i]});
                const currentSchedArr = [];
                for(let j=0;j<currentSched.schedule.length;j++){
                    const aClass = await Course.findOne({_id: currentSched.schedule[j]});
                    currentSchedArr.push(aClass);
                }
                schedules.push({schedule:currentSchedArr});
            }
        }
        res.render('scheduleFavorites', {schedules: schedules, user: req.user});

    }
    
});



app.listen(process.env.PORT ?? 3000);