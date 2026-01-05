# Frontend Integration

## Logic Flow
1. **Login**: User enters SAPID + Password.
   - If success, check `data.needs_course_selection`.
   - If `true` -> Redirect to Course Selection Screen.
   - If `false` -> Redirect to Dashboard.

## Code Example

```javascript
/* Login Component */
const handleLogin = async () => {
   const data = await apiClient.login(sapid, password);
   localStorage.setItem('token', data.token);
   
   if (data.needs_course_selection) {
       navigate('/select-course');
   } else {
       navigate('/dashboard');
   }
};

/* Course Selection Component */
useEffect(() => {
    // Load courses for dropdown
    apiClient.getCourses().then(setCourses);
}, []);

const handleSelect = async (courseId) => {
    await apiClient.setCourse(courseId, token);
    navigate('/dashboard');
}
```
