// helper functions
export function timeToString(time) {
    let string = '';
    const hour = time.split(':')[0];
    const min = time.split(':')[1];
    let suf = '';
    if(hour>=12){
        suf = "p.m.";
    }
    else{
        suf = "a.m";
    }
    
    if(hour>12){
        string += hour%12;
        string+= `:${min} `;
        string += suf;
    }
    else{
        string += hour;
        string += `:${min} `;
        string += suf;
    }
    return string;
}

export function checkConflict(course1, course2){
    const course1Start = course1.start;
    const course1End= course1.end;
    const course1Days = course1.days;
    const course2Start = course2.start;
    const course2End = course2.end;
    const course2Days = course2.days;

    if((course1Start <= course2End) && (course1End >= course2Start)){
        for(let i =0; i<course1Days.length;i++){
            if(course2Days.includes(course1Days[i])){
                return false;
            }
        }
    }
    return true;
}
export function genSchedule(courses){
    let invalid = true;
    let pickedCourses =[];
    let sched = [];
    let count =0;
    if(courses.length<4){
        return -1;
    }
    

    //put the following in a while loop
    while(invalid){ 
        if (count=== 1000)
        {
            break;
        }
        sched = [...courses];
        const course1 = sched[Math.floor(Math.random() * sched.length)];
        const index1 = sched.indexOf(course1);
        sched.splice(index1,1);

        const course2 = sched[Math.floor(Math.random() * sched.length)];
        const index2 = sched.indexOf(course2);
        sched.splice(index2,1);

        const course3 = sched[Math.floor(Math.random() * sched.length)];
        const index3 = sched.indexOf(course3);
        sched.splice(index3,1);

        const course4 = sched[Math.floor(Math.random() * sched.length)];
        const index4 = sched.indexOf(course4);
        sched.splice(index4,1);

        pickedCourses = [course1, course2, course3, course4];
        const newPicked = pickedCourses.filter((ele, index)=>{
            for(let i=index+1;i<pickedCourses.length;i++){
                if(checkConflict(ele, pickedCourses[i]) === false){
                    return false;
                }

            }
            return true;
        });
        //stops the while loop as the schedule generated is valid
        if(newPicked.length === 4){
            invalid = false;
        }
        count++;
    }
    if(count===1000){
        return -1;
    }
    return pickedCourses;
    

}

export function timeToInt(time){
    let intTime =0;
    const hour = time.split(':')[0];
    const min = time.split(':')[1];
    intTime += hour*60;
    intTime += min*1;
    return intTime;    

}