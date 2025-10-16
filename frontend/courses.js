import { API_URL } from './config.js';

// Function to fetch courses
export async function fetchCourses() {
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
export async function displayCourses(containerSelector, limit = 0) {
    const coursesContainer = document.querySelector(containerSelector);
    if (!coursesContainer) return;

    const courses = await fetchCourses();
    coursesContainer.innerHTML = '';

    const coursesToDisplay = limit > 0 ? courses.slice(0, limit) : courses;

    if (coursesToDisplay.length === 0) {
        coursesContainer.innerHTML = '<p>No courses available at the moment.</p>';
        return;
    }

    coursesToDisplay.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.classList.add('course-item');
        courseItem.innerHTML = `
            <img src="${course.image}" alt="${course.title}">
            <h3>${course.title}</h3>
            <p class="course-instructor">Instructor: ${course.instructor}</p>
            <p class="course-description">${course.description}</p>
            <p class="course-price">$${course.price.toFixed(2)}</p>
            <a href="courses.html#${course.id}" class="button course-button">Enroll Now</a>
        `;
        coursesContainer.appendChild(courseItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.course-grid')) {
        displayCourses('.course-grid');
    }
});