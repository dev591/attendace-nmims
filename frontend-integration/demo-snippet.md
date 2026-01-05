# Frontend Integration Guide

## Logic Flow
1. **Login**: User enters SAPID + Password.
   - If success, check `data.needs_course_selection`.
   - If `true` -> Redirect to Course Selection Screen.
   - If `false` -> Redirect to Dashboard.

## Code Example

```javascript
/* Login Component */
import { apiClient } from './api-client';

const handleLogin = async () => {
   try {
       const data = await apiClient.login(sapid, password);
       localStorage.setItem('token', data.token);
       localStorage.setItem('studentId', data.student_id);
       
       if (data.needs_course_selection) {
           navigate('/select-course');
       } else {
           navigate('/dashboard');
       }
   } catch (err) {
       alert('Login failed: ' + err.message);
   }
};

/* Course Selection Component */
import { useEffect, useState } from 'react';

const CourseSelector = () => {
    const [courses, setCourses] = useState([]);
    
    useEffect(() => {
        apiClient.getCourses().then(setCourses);
    }, []);

    const handleSelect = async (courseId) => {
        const token = localStorage.getItem('token');
        await apiClient.setCourse(courseId, token);
        navigate('/dashboard');
    }
    
    // Render dropdown...
}
```
