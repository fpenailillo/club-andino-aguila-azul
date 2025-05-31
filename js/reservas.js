// ===== SISTEMA DE RESERVAS - CLUB ANDINO ÁGUILA AZUL =====

// === VARIABLES GLOBALES ===
let currentDate = new Date();
let selectedDates = [];
let bookingData = {};
let availabilityData = {};

// Tarifas por tipo de usuario (por persona por noche)
const RATES = {
    socio: 15000,
    visitante: 25000,
    grupo_estudiantil: 12000
};

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    initializeReservationSystem();
    setupEventListeners();
    generateCalendar();
    loadAvailabilityData();
    console.log('🏔️ Sistema de Reservas Inicializado');
});

// === INICIALIZACIÓN DEL SISTEMA ===
function initializeReservationSystem() {
    // Configurar fecha mínima en inputs de fecha
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput) checkInInput.min = minDate;
    if (checkOutInput) checkOutInput.min = minDate;
    
    // Configurar validaciones en tiempo real
    setupFormValidation();
}

// === CONFIGURACIÓN DE EVENT LISTENERS ===
function setupEventListeners() {
    // Navegación del calendario
    const calendarNavs = document.querySelectorAll('.calendar-nav');
    calendarNavs.forEach(nav => {
        nav.addEventListener('click', handleCalendarNavigation);
    });
    
    // Formulario de reserva
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
        
        // Listeners para actualización de precios
        const priceInputs = ['checkIn', 'checkOut', 'guests', 'userType'];
        priceInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', updatePricing);
            }
        });
    }
    
    // Validación de RUT
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.addEventListener('input', formatRUT);
        rutInput.addEventListener('blur', validateRUTField);
    }
    
    // Validación de teléfono
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhone);
    }
}

// === GENERACIÓN DEL CALENDARIO ===
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) return;
    
    // Actualizar título del mes
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Limpiar calendario
    calendarGrid.innerHTML = '';
    
    // Obtener primer día del mes y número de días
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const dayElement = createCalendarDay(cellDate);
        calendarGrid.appendChild(dayElement);
    }
}

// === CREAR DÍA DEL CALENDARIO ===
function createCalendarDay(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = date.getDate();
    
    const today = new Date();
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    
    // Clases CSS
    if (!isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    if (isPast) {
        dayElement.classList.add('past');
        return dayElement;
    }
    
    // Determinar disponibilidad
    const dateString = formatDateString(date);
    const availability = getAvailabilityForDate(dateString);
    
    switch (availability) {
        case 'available':
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectDate(date));
            break;
        case 'reserved':
            dayElement.classList.add('reserved');
            dayElement.title = 'Día reservado';
            break;
        case 'maintenance':
            dayElement.classList.add('maintenance');
            dayElement.title = 'Mantenimiento programado';
            break;
        default:
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectDate(date));
    }
    
    return dayElement;
}

// === NAVEGACIÓN DEL CALENDARIO ===
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
}

function handleCalendarNavigation(event) {
    const direction = event.target.textContent === '❮' ? -1 : 1;
    changeMonth(direction);
}

// === SELECCIÓN DE FECHAS ===
function selectDate(date) {
    const dateString = formatDateString(date);
    
    // Si ya está seleccionada, deseleccionar
    if (selectedDates.includes(dateString)) {
        selectedDates = selectedDates.filter(d => d !== dateString);
    } else {
        selectedDates.push(dateString);
    }
    
    // Mantener solo las dos fechas más recientes
    if (selectedDates.length > 2) {
        selectedDates = selectedDates.slice(-2);
    }
    
    // Actualizar campos del formulario
    updateFormDates();
    
    // Regenerar calendario
    generateCalendar();
    
    // Actualizar precios
    updatePricing();
}

// === ACTUALIZAR CAMPOS DE FECHA EN EL FORMULARIO ===
function updateFormDates() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (selectedDates.length === 1) {
        checkInInput.value = selectedDates[0];
        checkOutInput.value = '';
    } else if (selectedDates.length === 2) {
        const dates = selectedDates.sort();
        checkInInput.value = dates[0];
        checkOutInput.value = dates[1];
    }
}

// === VALIDACIÓN DEL FORMULARIO ===
function setupFormValidation() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidation);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldName = field.name;
    
    clearFieldValidation(field);
    
    switch (fieldName) {
        case 'name':
            if (value.length < 2) {
                showFieldError(field, 'El nombre debe tener al menos 2 caracteres');
                return false;
            }
            break;
            
        case 'rut':
            if (value && !validateRUTFormat(value)) {
                showFieldError(field, 'RUT inválido');
                return false;
            }
            break;
            
        case 'email':
            if (!validateEmail(value)) {
                showFieldError(field, 'Email inválido');
                return false;
            }
            break;
            
        case 'phone':
            if (!validatePhone(value)) {
                showFieldError(field, 'Teléfono inválido');
                return false;
            }
            break;
            
        case 'checkIn':
        case 'checkOut':
            if (!validateDates()) {
                showFieldError(field, 'Fechas inválidas');
                return false;
            }
            break;
    }
    
    showFieldSuccess(field);
    return true;
}

function validateDates() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    
    if (!checkIn || !checkOut) return false;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    return checkOutDate > checkInDate;
}

// === MANEJO DEL ENVÍO DEL FORMULARIO ===
function handleBookingSubmit(event) {
    event.preventDefault();
    
    // Validar formulario completo
    if (!validateCompleteForm()) {
        showNotification('error', 'Error en el formulario', 'Por favor corrige los errores señalados');
        return;
    }
    
    // Mostrar loading
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="spinner"></span>Procesando...';
    submitButton.disabled = true;
    
    // Recopilar datos
    const formData = new FormData(event.target);
    const reservationData = {};
    
    for (let [key, value] of formData.entries()) {
        reservationData[key] = value;
    }
    
    // Agregar datos calculados
    reservationData.totalCost = calculateTotalCost();
    reservationData.nights = calculateNights();
    reservationData.timestamp = new Date().toISOString();
    
    // Simular envío
    setTimeout(() => {
        processReservation(reservationData);
        
        // Restaurar botón
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }, 2000);
}

function validateCompleteForm() {
    const form = document.getElementById('bookingForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// === PROCESAMIENTO DE LA RESERVA ===
function processReservation(data) {
    console.log('📝 Procesando reserva:', data);
    
    // Enviar datos a Google Sheets
    sendToGoogleSheets(data)
        .then(response => {
            if (response.result === 'success') {
                showNotification('success', '¡Reserva Exitosa!', 
                    `Tu solicitud de reserva ha sido enviada. Te contactaremos en 24 horas para confirmar.`);
                
                // Limpiar formulario
                resetForm();
                
                // Actualizar disponibilidad (simulado)
                updateAvailabilityAfterBooking(data);
            } else {
                throw new Error(response.error || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('❌ Error al enviar reserva:', error);
            showNotification('error', 'Error en la Reserva', 
                'Hubo un problema al procesar tu reserva. Por favor intenta nuevamente o contactanos directamente.');
        });
}

// === ENVÍO A GOOGLE SHEETS ===
function sendToGoogleSheets(data) {
    // 🔗 PASO CRÍTICO: Reemplaza esta URL con la URL de tu Google Apps Script deployment
    // 
    // 📋 CÓMO OBTENER LA URL:
    // 1. Ve a: https://docs.google.com/spreadsheets/d/1A7h7QD0QKtN1Z_gaUucsyD-ByKu4vsnN1GMIGr71abI/edit
    // 2. Extensiones → Apps Script
    // 3. Implementar → Nueva implementación → Aplicación web → Cualquier persona
    // 4. Copiar la URL del deployment
    // 
    // 🔽 REEMPLAZAR ESTA LÍNEA CON TU URL REAL:
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7vA-W1A1ieC9zyAMb2wCTkatOJfdXD_d6ww6kKgZ-a5eLF6VDzpk9_pyCy6F05aaopw/exec';
    // 
    // ✅ EJEMPLO DE URL CORRECTA:
    // const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1234567890abcdefghijk/exec';
    
    return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'addReservation',
            data: data
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error en la solicitud:', error);
        throw error;
    });
}

// === ACTUALIZACIÓN DE PRECIOS ===
function updatePricing() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const guests = parseInt(document.getElementById('guests').value) || 0;
    const userType = document.getElementById('userType').value;
    
    const costSummary = document.getElementById('costSummary');
    
    if (!checkIn || !checkOut || !guests || !userType) {
        costSummary.style.display = 'none';
        return;
    }
    
    const nights = calculateNights();
    const rate = RATES[userType] || 0;
    const subtotal = nights * rate * guests;
    const total = subtotal; // Aquí se podrían agregar impuestos o descuentos
    
    // Actualizar elementos
    document.getElementById('nightsCount').textContent = nights;
    document.getElementById('nightly_rate').textContent = formatCurrency(rate);
    document.getElementById('guestsCount').textContent = guests;
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('totalCost').textContent = formatCurrency(total);
    
    costSummary.style.display = 'block';
}

function calculateNights() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    
    if (!checkIn || !checkOut) return 0;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateTotalCost() {
    const nights = calculateNights();
    const guests = parseInt(document.getElementById('guests').value) || 0;
    const userType = document.getElementById('userType').value;
    const rate = RATES[userType] || 0;
    
    return nights * rate * guests;
}

// === VALIDACIONES ESPECÍFICAS ===
function validateRUTFormat(rut) {
    // Remover puntos, guión y espacios
    const cleanRUT = rut.replace(/[.\-\s]/g, '');
    
    if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toLowerCase();
    
    // Validar que el cuerpo sean solo números
    if (!/^\d+$/.test(body)) return false;
    
    // Validar dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder < 2 ? remainder.toString() : (remainder === 10 ? 'k' : (11 - remainder).toString());
    
    return dv === calculatedDV;
}

// Función específica para validar RUT en el campo
function validateRUTField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    clearFieldValidation(field);
    
    if (value && !validateRUTFormat(value)) {
        showFieldError(field, 'RUT inválido');
        return false;
    }
    
    if (value) {
        showFieldSuccess(field);
    }
    
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^(\+56\s?)?[1-9]\s?\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// === FORMATEO DE CAMPOS ===
function formatRUT(event) {
    let value = event.target.value.replace(/[^\dk]/gi, '');
    
    if (value.length > 1) {
        const body = value.slice(0, -1);
        const dv = value.slice(-1);
        
        // Formatear con puntos cada 3 dígitos
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        value = formattedBody + '-' + dv;
    }
    
    event.target.value = value;
    
    // Validar en tiempo real
    clearFieldValidation(event.target);
}

function formatPhone(event) {
    let value = event.target.value.replace(/[^\d+]/g, '');
    
    if (value.startsWith('569')) {
        value = '+56 9 ' + value.slice(3, 7) + ' ' + value.slice(7, 11);
    } else if (value.startsWith('+569')) {
        value = '+56 9 ' + value.slice(4, 8) + ' ' + value.slice(8, 12);
    }
    
    event.target.value = value;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
}

// === GESTIÓN DE DISPONIBILIDAD ===
function loadAvailabilityData() {
    // Datos simulados - en producción vendrían de una API
    availabilityData = {
        '2025-06-15': 'reserved',
        '2025-06-16': 'reserved',
        '2025-06-20': 'maintenance',
        '2025-06-25': 'reserved',
        '2025-07-01': 'reserved',
        '2025-07-10': 'maintenance',
        // Los demás días se consideran disponibles
    };
}

function getAvailabilityForDate(dateString) {
    return availabilityData[dateString] || 'available';
}

function updateAvailabilityAfterBooking(reservationData) {
    const checkIn = new Date(reservationData.checkIn);
    const checkOut = new Date(reservationData.checkOut);
    
    for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
        const dateString = formatDateString(date);
        availabilityData[dateString] = 'reserved';
    }
    
    generateCalendar();
}

// === FAQ FUNCTIONALITY ===
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Cerrar todas las FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Abrir la seleccionada si no estaba activa
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// === UTILIDADES ===
function formatDateString(date) {
    return date.toISOString().split('T')[0];
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    errorElement.innerHTML = `⚠️ ${message}`;
}

function showFieldSuccess(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('success');
    formGroup.classList.remove('error');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function clearFieldValidation(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error', 'success');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function clearValidation(event) {
    clearFieldValidation(event.target);
}

function resetForm() {
    const form = document.getElementById('bookingForm');
    if (form) {
        form.reset();
        selectedDates = [];
        
        // Limpiar validaciones
        form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error', 'success');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) errorElement.remove();
        });
        
        // Ocultar resumen de costos
        document.getElementById('costSummary').style.display = 'none';
        
        // Regenerar calendario
        generateCalendar();
    }
}

function showNotification(type, title, message = '') {
    // Crear contenedor si no existe
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10001;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${message ? '0.5rem' : '0'};">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${iconMap[type] || iconMap.info}</span>
                <span style="font-weight: 600; color: #2C3E50;">${title}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        ${message ? `<div style="color: #666; font-size: 0.9rem; line-height: 1.4; margin-left: 1.5rem;">${message}</div>` : ''}
    `;
    
    container.appendChild(notification);
    
    // Auto-remove después de 8 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 8000);
}

// === FUNCIONES GLOBALES PARA HTML ===
window.changeMonth = changeMonth;
window.toggleFAQ = toggleFAQ;
window.updatePricing = updatePricing;
window.resetForm = resetForm;

// === MANEJO DE ERRORES ===
window.addEventListener('error', function(e) {
    console.error('❌ Error en el sistema de reservas:', e.error);
    showNotification('error', 'Error del Sistema', 'Se ha producido un error. Por favor recarga la página.');
});

console.log('🎉 Sistema de Reservas - Club Andino Águila Azul cargado');
console.log('📧 Reservas: reservas@clubandinoaguilaazul.cl');
console.log('📱 WhatsApp: +56 9 8660 3885');