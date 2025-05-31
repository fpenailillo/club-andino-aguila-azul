// === CLUB ANDINO ÁGUILA AZUL - JAVASCRIPT PRINCIPAL ===

// === VARIABLES GLOBALES ===
let currentPhotoIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// Datos de la galería
const galleryData = [
    {
        image: "https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Expedición+Aconcagua",
        title: "Expedición Aconcagua",
        description: "Ascenso al techo de América - Enero 2024"
    },
    {
        image: "https://via.placeholder.com/400x400/34495E/FFFFFF?text=Punta+Águila+Azul",
        title: "Punta Águila Azul - Cara Norte",
        description: "Expedición técnica a nuestro cerro emblemático"
    },
    {
        image: "https://via.placeholder.com/400x400/5D6D7E/FFFFFF?text=Escalada+Hielo",
        title: "Taller Escalada en Hielo",
        description: "Formación técnica en técnicas invernales"
    },
    {
        image: "https://via.placeholder.com/400x400/1B2631/FFFFFF?text=Ski+Farellones",
        title: "Escuela de Ski Niños",
        description: "Temporada invernal en nuestro refugio"
    },
    {
        image: "https://via.placeholder.com/400x400/273746/FFFFFF?text=San+Gabriel",
        title: "Cerro San Gabriel",
        description: "Ascensión grupal de invierno"
    },
    {
        image: "https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Campamento+Verano",
        title: "Campamento de Verano",
        description: "Convivencia y formación en la cordillera"
    },
    {
        image: "https://via.placeholder.com/400x400/4682B4/FFFFFF?text=Aniversario+86",
        title: "Aniversario 86 Años",
        description: "Celebración de nuestra rica historia"
    },
    {
        image: "https://via.placeholder.com/400x400/87CEEB/333333?text=Torres+del+Paine",
        title: "Circuito W Torres del Paine",
        description: "Travesía épica en la Patagonia"
    },
    {
        image: "https://via.placeholder.com/400x400/696969/FFFFFF?text=Refugio+Farellones",
        title: "Refugio Farellones",
        description: "Nuestro hogar en la montaña"
    }
];

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏔️ Club Andino Águila Azul - Cargando...');
    
    setupIntersectionObserver();
    setupSmoothScrolling();
    setupActiveNavigation();
    setupFormHandling();
    initializeGallery();
    setupTouchGestures();
    setupKeyboardNavigation();
    setupLazyLoading();
    handleWindowResize();
    
    console.log('✅ Sitio web completamente cargado');
});

// === NAVEGACIÓN ACTIVA ===
function setupActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    function updateActiveNavigation() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Actualizar en scroll
    window.addEventListener('scroll', throttle(updateActiveNavigation, 100));
    updateActiveNavigation(); // Ejecutar inicialmente
}

// === INTERSECTION OBSERVER PARA ANIMACIONES ===
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animación especial para contadores
                if (entry.target.classList.contains('stat-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observar elementos con animaciones
    const animatedElements = document.querySelectorAll('.fade-in, .stat-card, .sport-card, .gallery-item, .news-card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// === ANIMACIÓN DE CONTADORES ===
function animateCounter(element) {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// === SCROLL SUAVE ===
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Cerrar menú móvil si está abierto
                const mobileOverlay = document.querySelector('.mobile-menu-overlay');
                if (mobileOverlay && mobileOverlay.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });
    
    // Scroll suave para el indicador del hero
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const statsSection = document.querySelector('.stats');
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// === MANEJO DE FORMULARIOS ===
function setupFormHandling() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validación básica
            const formData = new FormData(this);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value.trim();
            }
            
            if (validateContactForm(data)) {
                submitContactForm(data);
            }
        });
    }
}

function validateContactForm(data) {
    const errors = [];
    
    if (!data.nombre || data.nombre.length < 2) {
        errors.push('Nombre es requerido (mínimo 2 caracteres)');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email válido es requerido');
    }
    
    if (!data.mensaje || data.mensaje.length < 10) {
        errors.push('Mensaje es requerido (mínimo 10 caracteres)');
    }
    
    if (errors.length > 0) {
        showNotification('error', 'Errores en el formulario', errors.join(', '));
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function submitContactForm(data) {
    // Mostrar loading
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    // Enviar a Google Sheets
    sendContactToGoogleSheets(data)
        .then(response => {
            if (response.result === 'success') {
                showNotification('success', '¡Mensaje Enviado!', 'Te contactaremos pronto. ¡Gracias por tu interés!');
                
                // Limpiar formulario
                document.querySelector('.contact-form').reset();
                
                // Track evento
                trackEvent('Contact', 'form_submit', data.deporte || 'general');
            } else {
                throw new Error(response.error || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('❌ Error al enviar contacto:', error);
            showNotification('error', 'Error al Enviar', 'Hubo un problema. Por favor intenta nuevamente o contactanos directamente.');
        })
        .finally(() => {
            // Restaurar botón
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// === ENVÍO DE CONTACTO A GOOGLE SHEETS ===
function sendContactToGoogleSheets(data) {
    // 🔗 PASO CRÍTICO: Reemplaza esta URL con la URL de tu Google Apps Script deployment
    // 
    // 📋 CÓMO OBTENER LA URL:
    // 1. Ve a: https://docs.google.com/spreadsheets/d/1A7h7QD0QKtN1Z_gaUucsyD-ByKu4vsnN1GMIGr71abI/edit
    // 2. Extensiones → Apps Script
    // 3. Implementar → Nueva implementación → Aplicación web → Cualquier persona
    // 4. Copiar la URL del deployment
    // 
    // 🔄 IMPORTANTE: Usa la MISMA URL que en reservas.js (es el mismo script)
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
            action: 'addContact',
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
        console.error('Error en la solicitud de contacto:', error);
        throw error;
    });
}

// === GALERÍA DE FOTOS ===
function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openModal(index));
    });
}

function openModal(index) {
    currentPhotoIndex = index;
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    
    if (modal && modalImage && galleryData[index]) {
        const photo = galleryData[index];
        
        modalImage.src = photo.image;
        modalImage.alt = photo.title;
        modalTitle.textContent = photo.title;
        modalDescription.textContent = photo.description;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Track evento
        trackEvent('Gallery', 'photo_open', photo.title);
    }
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function changePhoto(direction) {
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex >= galleryData.length) {
        currentPhotoIndex = 0;
    } else if (currentPhotoIndex < 0) {
        currentPhotoIndex = galleryData.length - 1;
    }
    
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    
    if (modalImage && galleryData[currentPhotoIndex]) {
        const photo = galleryData[currentPhotoIndex];
        
        modalImage.src = photo.image;
        modalImage.alt = photo.title;
        modalTitle.textContent = photo.title;
        modalDescription.textContent = photo.description;
        
        // Track evento
        trackEvent('Gallery', 'photo_navigate', photo.title);
    }
}

// === GESTOS TÁCTILES ===
function setupTouchGestures() {
    const modal = document.getElementById('photoModal');
    
    if (modal) {
        modal.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        modal.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                changePhoto(1); // Swipe left - next image
            } else {
                changePhoto(-1); // Swipe right - previous image
            }
        }
    }
}

// === NAVEGACIÓN POR TECLADO ===
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('photoModal');
        
        if (modal && modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    changePhoto(-1);
                    break;
                case 'ArrowRight':
                    changePhoto(1);
                    break;
            }
        }
        
        // Atajos globales
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'k':
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
            }
        }
    });
}

// === NAVEGACIÓN MÓVIL ===
function toggleMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    // Crear overlay si no existe
    let overlay = document.querySelector('.mobile-menu-overlay');
    if (!overlay) {
        overlay = createMobileMenuOverlay();
        body.appendChild(overlay);
    }
    
    // Toggle clases
    toggle.classList.toggle('active');
    overlay.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    // Prevenir scroll cuando el menú está abierto
    if (overlay.classList.contains('active')) {
        body.style.overflow = 'hidden';
    } else {
        body.style.overflow = '';
    }
}

function createMobileMenuOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    
    const content = document.createElement('div');
    content.className = 'mobile-menu-content';
    
    const navLinks = document.createElement('ul');
    navLinks.className = 'mobile-nav-links';
    
    // Copiar enlaces de navegación
    const mainNavLinks = document.querySelectorAll('.nav-links a');
    mainNavLinks.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.textContent;
        a.onclick = () => {
            toggleMobileMenu();
            // Scroll suave a la sección
            if (link.href.includes('#')) {
                const targetId = link.href.split('#')[1];
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                }
            }
        };
        li.appendChild(a);
        navLinks.appendChild(li);
    });
    
    // Agregar enlace de socios
    const sociosLink = document.createElement('a');
    sociosLink.href = 'socios.html';
    sociosLink.className = 'mobile-socios-access';
    sociosLink.textContent = 'Área de Socios';
    
    content.appendChild(navLinks);
    content.appendChild(sociosLink);
    overlay.appendChild(content);
    
    // Cerrar al hacer clic fuera del contenido
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            toggleMobileMenu();
        }
    });
    
    return overlay;
}

// === NOTIFICACIONES ===
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
    notification.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        border-left: 5px solid ${getNotificationColor(type)};
        animation: slideInNotification 0.3s ease;
        position: relative;
        overflow: hidden;
    `;
    
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
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationColor(type) {
    const colors = {
        'success': '#2e7d32',
        'error': '#c62828',
        'warning': '#f57f17',
        'info': '#2C3E50'
    };
    return colors[type] || colors.info;
}

// === RESPONSIVE HANDLING ===
function handleWindowResize() {
    const resizeHandler = debounce(() => {
        const width = window.innerWidth;
        
        if (width <= 768) {
            adjustMobileLayout();
        } else if (width <= 1024) {
            adjustTabletLayout();
        } else {
            adjustDesktopLayout();
        }
    }, 250);
    
    window.addEventListener('resize', resizeHandler);
    resizeHandler(); // Ejecutar inicialmente
}

function adjustMobileLayout() {
    // Cerrar menú móvil si está abierto al cambiar orientación
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay && overlay.classList.contains('active')) {
        toggleMobileMenu();
    }
}

function adjustTabletLayout() {
    // Ajustes específicos para tablet
}

function adjustDesktopLayout() {
    // Asegurar que el menú móvil esté cerrado
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay && overlay.classList.contains('active')) {
        toggleMobileMenu();
    }
}

// === LAZY LOADING ===
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// === UTILIDADES ===
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === ANALYTICS ===
function trackEvent(category, action, label = '') {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
    
    // Console log para desarrollo
    console.log(`📊 Event: ${category} - ${action} - ${label}`);
}

// === FUNCIONES GLOBALES PARA HTML ===
window.openModal = openModal;
window.closeModal = closeModal;
window.changePhoto = changePhoto;
window.toggleMobileMenu = toggleMobileMenu;

// === EVENTOS GLOBALES ===
// Modal click outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('photoModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Cerrar menú móvil con tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const overlay = document.querySelector('.mobile-menu-overlay');
        if (overlay && overlay.classList.contains('active')) {
            toggleMobileMenu();
        }
    }
});

// === INICIALIZACIÓN FINAL ===
window.addEventListener('load', function() {
    console.log('🎉 Club Andino Águila Azul - Sitio web cargado completamente');
    
    // Remover loading screen si existe
    const loader = document.querySelector('.loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    
    // Track page load
    trackEvent('Site', 'page_load', window.location.pathname);
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        showNotification('info', '¡Bienvenido!', 'Explora nuestras actividades y únete al Club Andino Águila Azul 🏔️');
    }, 2000);
});

// === SERVICE WORKER REGISTRATION ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker registrado exitosamente');
            })
            .catch(function(error) {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    });
}

// === PERFORMANCE MONITORING ===
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            console.log(`⚡ Tiempo de carga: ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.warn('⚠️ Sitio web cargando lento, considerar optimizaciones');
            }
        }, 100);
    });
}

// === ERROR HANDLING ===
window.addEventListener('error', function(e) {
    console.error('❌ Error detectado:', e.error);
    trackEvent('Error', 'javascript_error', e.error?.message || 'Unknown error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rechazada:', e.reason);
    trackEvent('Error', 'unhandled_promise_rejection', e.reason?.message || 'Unknown rejection');
});

// === ANIMACIONES CSS ADICIONALES ===
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInNotification {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutNotification {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🏔️ Club Andino Águila Azul - JavaScript cargado');
console.log('📧 Contacto: Directorio@clubandinoaguilaazul.cl');
console.log('📱 WhatsApp: +56 9 8660 3885');
console.log('📍 Sede: Almirante Simpson 3, Depto. 102, Providencia, Santiago');
console.log('🏠 Refugio: Farellones, 2.400 msnm');