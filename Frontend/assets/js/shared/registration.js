function goToNextPage() {
    const studentRadio = document.getElementById('student-radio');
    const professionalRadio = document.getElementById('professional-radio');
    
    if (studentRadio.checked) {
        window.location.href ='/pages/student/registration.html';
    } else if (professionalRadio.checked) {
        window.location.href = '/pages/professional/registration.html';
    } else {
        alert('Please select a user type');
    }
}