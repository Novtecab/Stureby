import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Function to fetch courses
    async function fetchCourses() {
        try {
            const response = await fetch(`${API_URL}/courses`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }

    // Function to display courses
    async function displayCourses() {
        const courseGrid = document.querySelector('.course-grid');
        if (!courseGrid) return;

        const courses = await fetchCourses();
        courseGrid.innerHTML = '';

        if (courses.length === 0) {
            courseGrid.innerHTML = '<p>No courses available at the moment.</p>';
            return;
        }

        courses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <img src="${course.image}" alt="${course.title} Thumbnail">
                <h3>${course.title}</h3>
                <p class="course-instructor">Instructor: ${course.instructor}</p>
                <p class="course-description">${course.description}</p>
                <p class="course-price">$${course.price.toFixed(2)}</p>
                <a href="#" class="button course-button">Enroll Now</a>
            `;
            courseGrid.appendChild(courseItem);
        });
    }

    if (document.querySelector('.course-grid')) {
        displayCourses();
    }
});