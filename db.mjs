import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import url from 'url';

const mongooseOpts = {
  useNewUrlParser: true,  
  useUnifiedTopology: true
};

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
  // if we're in PRODUCTION mode, then read the configration from a file
  // use blocking file io to do this...
  const fn = path.join(__dirname, 'config.json');
  const data = fs.readFileSync(fn);

  // our configuration file will be in json, so parse it and set the
  // conenction string appropriately!
  const conf = JSON.parse(data);
  dbconf = conf.dbconf;
} else {
  // if we're not in PRODUCTION mode, then use
  // we are here
  dbconf = 'mongodb://localhost/schoolietest';
}



//
try {
  await mongoose.connect(dbconf, mongooseOpts);
  console.log('connected to database');
} catch (err) {
  console.log(err);
}

const User = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    classes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}],
    schedules: [{type: mongoose.Schema.Types.ObjectId, ref: 'Schedule'}]
});



//schema for user and schedules
const Schedule = new mongoose.Schema({
    schedule: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});


//schema for user and schedules
const Course = new mongoose.Schema({
    courseName: String,
    courseNumber: String,
    year: Number,
    semester: String,
    professor: String,
    days:[String],
    daysString: String,
    start: Number,
    startString: String,
    end: Number,
    endString: String
   
});

mongoose.model('Course', Course);
mongoose.model('User', User);
mongoose.model('Schedule', Schedule);
