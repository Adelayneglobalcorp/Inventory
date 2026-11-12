import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "nav": {
                "dashboard": "Dashboard",
                "properties": "Inventory",
                "calculator": "Calculator",
                "deals": "Deals",
                "projectManager": "Project Manager",
                "financing": "Request Financing",
                "navigation": "Main navigation",
                "modules": "Modules",
                "openMenu": "Open menu",
                "closeMenu": "Close menu",
                "shortDashboard": "Dashboard",
                "shortProjects": "Projects",
                "shortFinancing": "Financing",
                "admin": "Admin",
                "role": "Role",
                "signOut": "Sign Out"
            },
            "authErrors": {
                "generic": "We could not complete your request. Please try again.",
                "invalidCredentials": "Incorrect email address or password.",
                "emailNotConfirmed": "Confirm your email address before signing in.",
                "rateLimited": "Too many attempts. Please try again later.",
                "notFound": "User not found.",
                "profileError": "We could not verify your user profile.",
                "pending": "Your account is waiting for approval by an administrator.",
                "signupError": "We could not complete registration."
            },
            "roles": { "admin": "Administrator", "usuario": "Investor", "investor": "Investor" },
            "dealsPage": {
                "title": "My Investments", "subtitle": "Investment analyses saved in this browser",
                "new": "New Analysis", "list": "Saved Investments",
                "empty": "No investments have been saved. Create an analysis and save it.",
                "project": "Project", "address": "Address", "investment": "Investment", "profit": "Profit",
                "status": "Status", "actions": "Actions",
                "positive": "Viable", "negative": "Not Viable",
                "deleteConfirm": "Delete this investment analysis?",
                "deleted": "Investment analysis deleted.",
                "manage": "Manage Project", "edit": "Edit Analysis", "delete": "Delete Analysis"
            },
            "pmHub": {
                "title": "Project Management", "subtitle": "Choose an investment to manage its budget, tasks, and schedule.",
                "emptyBefore": "There are no saved investments. Create one using the",
                "calculator": "calculator", "emptyMiddle": "or open your", "deals": "investment list",
                "budget": "Renovation Budget", "open": "Open Project"
            },
            "financing": {
                "title": "Request Financing", "subtitle": "Submit a financing request for your real estate investment.",
                "type": "Financing Type", "hard_money": "Hard Money Loan", "dscr": "DSCR Loan",
                "name": "Full Name", "email": "Email Address", "phone": "Phone Number",
                "propertyAddress": "Property Address", "city": "City", "state": "State", "zip": "ZIP Code",
                "amount": "Requested Loan Amount (USD)", "purchasePrice": "Purchase Price (USD)",
                "rehabBudget": "Renovation Budget (USD)", "arv": "After Repair Value (USD)",
                "estimatedValue": "Estimated Property Value (USD)", "notes": "Additional Information",
                "submit": "Submit Request", "sending": "Submitting...", "success": "Your financing request has been received.",
                "error": "We could not submit your request. Please try again.", "required": "Complete all required fields.",
                "invalidAmount": "Enter a valid loan amount greater than zero.",
                "privacy": "Your request is visible only to you and authorized administrators."
            },
            "dashboard": {
                "title": "My Investment Portfolio",
                "subtitle": "Track your real estate opportunities",
                "welcome": "Welcome back, {{name}}",
                "recentProperties": "Recent Properties",
                "loading": "Loading...",
                "noProperties": "No properties found",
                "interested": "Interested",
                "interest": "I'm Interested",
                "interestSuccess": "Interest registered successfully!",
                "interestRemoved": "Interest removed successfully.",
                "adminNoInterest": "Admins cannot show interest in properties",
                "alreadyInterested": "You already showed interest in this property",
                "errorAddInterest": "Error showing interest: ",
                "errorRemoveInterest": "Error removing interest: ",
                "interestedInProperty": "Interested in property",
                "errorGenericInterest": "An error occurred while processing your interest",
                "stats": {
                    "totalProperties": "Total Properties",
                    "available": "Available",
                    "onSale": "Not Available",
                    "sold": "Sold",
                    "portfolioValue": "Portfolio Value",
                    "totalArv": "Total ARV",
                    "avgRoi": "Avg. ROI",
                    "active": "Active Properties",
                    "interested": "Interested",
                    "roi": "Avg. Target ROI"
                }
            },
            "properties": {
                "title": "Property Inventory",
                "subtitle": "Browse and manage the available real estate opportunities",
                "list": {
                    "title": "Available Inventory",
                    "total": "Total: {{count}} properties",
                    "loading": "Loading properties...",
                    "noProperties": "No properties matching your criteria",
                    "arv": "ARV",
                    "rent": "Rent",
                    "gallery": "Photo Gallery",
                    "filters": {
                        "title": "Filters",
                        "searchPlaceholder": "Search by address, city...",
                        "status": "Filter by status",
                        "all": "All Properties",
                        "available": "Available",
                        "onSale": "Not Available",
                        "sold": "Sold"
                    },
                    "status": {
                        "available": "Available",
                        "onSale": "Not Available",
                        "sold": "Sold"
                    },
                    "beds": "Beds",
                    "bed": "Bed",
                    "baths": "Baths",
                    "bath": "Bath",
                    "sqft": "Sqft",
                    "labels": {
                        "rent": "Monthly Rent"
                    },
                    "actions": {
                        "view": "View Details",
                        "interest": "I'm Interested",
                        "removeInterest": "Remove Interest",
                        "share": "Share PDF",
                        "sharing": "Generating...",
                        "pdfGenerating": "Generating PDF report...",
                        "shareSuccess": "PDF shared successfully",
                        "shareError": "Error sharing PDF: "
                    },
                    "messages": {
                        "interestAdded": "Interest registered! We will contact you soon.",
                        "interestRemoved": "Interest removed successfully."
                    },
                    "delete": {
                        "title": "Delete Property",
                        "description": "Are you sure you want to delete \"{{title}}\"? This action cannot be undone.",
                        "cancel": "Cancel",
                        "confirm": "Delete"
                    }
                },
                "interests": {
                    "title": "Inquiries"
                }
            },
            "admin": {
                "title": "Admin Dashboard",
                "subtitle": "Manage users and properties of the system",
                "roleBadge": "Admin: {{email}}",
                "tabs": {
                    "overview": "Overview",
                    "users": "Users Management",
                    "properties": "Inventory",
                    "interests": "Interests"
                },
                "stats": {
                    "totalUsers": "Total Users",
                    "subtitleUsers": "Registered in the platform",
                    "activeUsers": "Active Users",
                    "subtitleActiveUsers": "Approved and active",
                    "subtitleProperties": "Current inventory",
                    "subtitleInterests": "Pending interests"
                },
                "actions": {
                    "title": "Quick Actions",
                    "subtitle": "Common administrative tasks",
                    "viewUsers": "Manage Users",
                    "manageProperties": "Manage Inventory",
                    "systemSettings": "System Settings"
                },
                "activity": {
                    "title": "Recent Activity",
                    "subtitle": "Latest platform events",
                    "loading": "Loading activity...",
                    "empty": "No recent activity",
                    "newUser": "New user: {{name}}",
                    "propertyCreated": "Property created: {{title}}",
                    "interestCreated": "{{name}} interested in {{title}}"
                },
                "interests": {
                    "title": "All Property Interests",
                    "loading": "Loading all interests...",
                    "registeredOn": "Interest registered: {{date}}",
                    "empty": {
                        "title": "No interests registered",
                        "description": "No one has shown interest in the properties yet."
                    },
                    "status": {
                        "pending": "Pending",
                        "contacted": "Contacted",
                        "rejected": "Rejected"
                    },
                    "actions": {
                        "contact": "Contact",
                        "reject": "Reject",
                        "markPending": "Mark as pending",
                        "reconsider": "Reconsider"
                    },
                    "messages": {
                        "loadingError": "Error loading all interests",
                        "updateError": "Error updating status",
                        "updateSuccess": "Status updated successfully"
                    }
                },
                "properties": {
                    "title": "Inventory Management",
                    "subtitle": "Create, edit and delete properties in the catalog",
                    "add": "Add Property",
                    "addTitle": "Add New Property",
                    "editTitle": "Edit Property",
                    "form": {
                        "titleEdit": "Edit Property",
                        "titleNew": "Add New Property",
                        "description": "Complete the details below to manage the property information.",
                        "tabs": {
                            "basic": "Basic Information",
                            "financial": "Financial Information",
                            "media": "Images"
                        },
                        "sections": {
                            "manualInputs": "Manual Inputs",
                            "automatedResults": "Automated Financial Results",
                            "fixAndFlip": "Fix & Flip Calculations",
                            "rent": "Rental Calculations"
                        },
                        "fields": {
                            "title": "Title",
                            "titlePlaceholder": "Ex: 3 bedroom house downtown",
                            "type": "Property Type",
                            "typePlaceholder": "Ex: House, Apartment, Land",
                            "address": "Address",
                            "addressPlaceholder": "123 Main St",
                            "city": "City",
                            "state": "State",
                            "zipCode": "Zip Code",
                            "bedrooms": "Bedrooms",
                            "bathrooms": "Bathrooms",
                            "sqft": "Square Feet",
                            "yearBuilt": "Year Built",
                            "description": "Description",
                            "descriptionPlaceholder": "Describe the property...",
                            "status": "Status",
                            "price": "Price ($)",
                            "arv": "After Repair Value (ARV) ($)",
                            "roi": "ROI (%)",
                            "rehab": "Repair Cost ($)",
                            "rent": "Monthly Rent ($)",
                            "otherCosts": "Other Costs (Closing + Holding) ($)",
                            "operatingExpenses": "Monthly Operating Expenses ($)",
                            "totalInvestment": "Total Investment",
                            "netProfit": "Net Profit",
                            "annualIncome": "Annual Income",
                            "annualNoi": "Annual NOI",
                            "capRate": "Cap Rate (%)",
                            "images": "Property Images",
                            "imagesHint": "You can upload multiple images. The first one will be the primary.",
                            "primary": "Primary"
                        },
                        "actions": {
                            "save": "Save Property",
                            "saving": "Saving...",
                            "update": "Update Property",
                            "create": "Create Property",
                            "uploadDesktop": "Upload from Desktop",
                            "uploadDropbox": "Upload from Dropbox"
                        }
                    }
                },
                "users": {
                    "title": "Users Management",
                    "subtitle": "Manage registered users and their permissions",
                    "update": "Update",
                    "loading": "Loading users...",
                    "registeredTitle": "Registered Users",
                    "total": "Total: {{count}} users",
                    "table": {
                        "user": "User",
                        "email": "Email",
                        "role": "Role",
                        "status": "Status",
                        "emailConfirmed": "Email Confirmed",
                        "lastLogin": "Last Login",
                        "actions": "Actions"
                    },
                    "status": {
                        "approved": "Approved",
                        "pending": "Pending",
                        "never": "Never",
                        "noName": "No name"
                    },
                    "actions": {
                        "confirmEmail": "Confirm Email",
                        "quickApprove": "Quick Approve",
                        "changeRole": "Change Role",
                        "generateCode": "Generate Code",
                        "delete": "Delete"
                    },
                    "dialogs": {
                        "role": {
                            "title": "Manage User",
                            "description": "Manage the role and approval of {{name}}",
                            "label": "New Role",
                            "approve": "Approve",
                            "reject": "Reject",
                            "update": "Update Role"
                        },
                        "code": {
                            "title": "Generate Admin Code",
                            "description": "Generate a code so that {{name}} can register as an administrator",
                            "generatedLabel": "Generated code:",
                            "copyHint": "Copy this code and share it with the user",
                            "generate": "Generate Code",
                            "close": "Close"
                        }
                    },
                    "messages": {
                        "roleUpdated": "Role of {{name}} updated to {{role}}",
                        "approved": "User {{name}} approved successfully",
                        "approvedWithEmail": "User {{name}} approved successfully. Email confirmed: {{status}}",
                        "rejected": "User {{name}} rejected",
                        "emailConfirmed": "Email confirmed successfully",
                        "codeGenerated": "Code generated for {{name}}: {{code}}",
                        "deleteConfirm": "Are you sure you want to delete this user? This action cannot be undone.",
                        "deleted": "User deleted successfully",
                        "partial": "Partially",
                        "yes": "Yes",
                        "sendReset": "Send Reset Email",
                        "resetSent": "Password reset email sent to {{email}}"
                    }
                }
            },
            "common": {
                "language": "Language",
                "loading": "Loading...",
                "cancel": "Cancel",
                "confirm": "Confirm"
            },
            "login": {
                "title": "Property Inventory",
                "subtitle": "Access the premium off market deals",
                "signIn": "Sign In",
                "signUp": "Create Account",
                "email": "Email Address",
                "password": "Password",
                "forgotPassword": "Forgot your password?",
                "signingIn": "Signing in...",
                "fullName": "Full Name",
                "creating": "Creating account...",
                "createAccount": "Sign Up",
                "loginFailed": "Login failed: ",
                "loginSuccess": "Login successful",
                "signUpFailed": "Sign up failed: ",
                "signUpSuccess": "Check your email to confirm your account",
                "backToLogin": "Back to login",
                "phone": "Phone number",
                "phonePlaceholder": "e.g. 555 123 4567",
                "phoneInvalid": "Please enter a valid phone number"
            },
            "resetPassword": {
                "title": "Reset Password",
                "description": "Enter your email to receive a password reset link",
                "emailLabel": "Email Address",
                "sending": "Sending link...",
                "sendButton": "Send Reset Link",
                "error": "Error: ",
                "success": "Reset link sent! Check your inbox",
                "newPasswordTitle": "Create New Password",
                "newPasswordDescription": "Enter your new password below",
                "passwordLabel": "New Password",
                "confirmPasswordLabel": "Confirm New Password",
                "updating": "Updating...",
                "updateButton": "Update Password",
                "passwordMismatch": "Passwords do not match",
                "passwordMinLength": "Password must be at least 6 characters",
                "updateError": "Update failed: ",
                "updateSuccess": "Password updated successfully"
            }
        }
    },
    es: {
        translation: {
            "nav": {
                "dashboard": "Panel de control",
                "properties": "Inventario",
                "calculator": "Calculadora",
                "deals": "Operaciones",
                "projectManager": "Gestión de proyectos",
                "financing": "Solicitar financiamiento",
                "navigation": "Navegación principal",
                "modules": "Módulos",
                "openMenu": "Abrir menú",
                "closeMenu": "Cerrar menú",
                "shortDashboard": "Panel",
                "shortProjects": "Proyectos",
                "shortFinancing": "Financiamiento",
                "admin": "Administración",
                "role": "Rol",
                "signOut": "Cerrar Sesión"
            },
            "authErrors": {
                "generic": "No pudimos completar tu solicitud. Inténtalo nuevamente.",
                "invalidCredentials": "El correo electrónico o la contraseña son incorrectos.",
                "emailNotConfirmed": "Confirma tu correo electrónico antes de ingresar.",
                "rateLimited": "Demasiados intentos. Inténtalo más tarde.",
                "notFound": "No se encontró el usuario.",
                "profileError": "No pudimos verificar tu perfil de usuario.",
                "pending": "Tu cuenta está pendiente de aprobación por un administrador.",
                "signupError": "No pudimos completar el registro."
            },
            "roles": { "admin": "Administrador", "usuario": "Inversionista", "investor": "Inversionista" },
            "dealsPage": {
                "title": "Mis inversiones", "subtitle": "Análisis de inversión guardados en este navegador",
                "new": "Nuevo análisis", "list": "Inversiones guardadas",
                "empty": "No hay inversiones guardadas. Crea un análisis y guárdalo.",
                "project": "Proyecto", "address": "Dirección", "investment": "Inversión", "profit": "Ganancia",
                "status": "Estado", "actions": "Acciones",
                "positive": "Viable", "negative": "No viable",
                "deleteConfirm": "¿Eliminar este análisis de inversión?",
                "deleted": "Análisis de inversión eliminado.",
                "manage": "Gestionar proyecto", "edit": "Editar análisis", "delete": "Eliminar análisis"
            },
            "pmHub": {
                "title": "Gestión de proyectos", "subtitle": "Selecciona una inversión para administrar su presupuesto, tareas y cronograma.",
                "emptyBefore": "No hay inversiones guardadas. Crea una desde la",
                "calculator": "calculadora", "emptyMiddle": "o consulta tu", "deals": "lista de inversiones",
                "budget": "Presupuesto de remodelación", "open": "Abrir proyecto"
            },
            "financing": {
                "title": "Solicitar financiamiento", "subtitle": "Envía una solicitud de financiamiento para tu inversión inmobiliaria.",
                "type": "Tipo de financiamiento", "hard_money": "Préstamo para inversión y remodelación", "dscr": "Préstamo DSCR",
                "name": "Nombre completo", "email": "Correo electrónico", "phone": "Número de teléfono",
                "propertyAddress": "Dirección de la propiedad", "city": "Ciudad", "state": "Estado", "zip": "Código postal",
                "amount": "Monto solicitado (USD)", "purchasePrice": "Precio de compra (USD)",
                "rehabBudget": "Presupuesto de remodelación (USD)", "arv": "Valor después de remodelar (USD)",
                "estimatedValue": "Valor estimado de la propiedad (USD)", "notes": "Información adicional",
                "submit": "Enviar solicitud", "sending": "Enviando...", "success": "Hemos recibido tu solicitud de financiamiento.",
                "error": "No pudimos enviar tu solicitud. Inténtalo nuevamente.", "required": "Completa todos los campos obligatorios.",
                "invalidAmount": "Ingresa un monto solicitado válido y mayor que cero.",
                "privacy": "Solo tú y los administradores autorizados pueden consultar tu solicitud."
            },
            "dashboard": {
                "title": "Mi Portafolio de Inversión",
                "subtitle": "Sigue tus oportunidades inmobiliarias",
                "welcome": "Bienvenido, {{name}}",
                "recentProperties": "Propiedades Recientes",
                "loading": "Cargando...",
                "noProperties": "No se encontraron propiedades",
                "interested": "Interesado",
                "interest": "Me Interesa",
                "interestSuccess": "¡Interés registrado exitosamente!",
                "interestRemoved": "Interés eliminado exitosamente.",
                "adminNoInterest": "Los administradores no pueden mostrar interés en propiedades",
                "alreadyInterested": "Ya has mostrado interés en esta propiedad",
                "errorAddInterest": "Error al mostrar interés: ",
                "errorRemoveInterest": "Error al eliminar interés: ",
                "interestedInProperty": "Interesado en la propiedad",
                "errorGenericInterest": "Ocurrió un error al procesar tu interés",
                "stats": {
                    "totalProperties": "Propiedades Totales",
                    "available": "Disponibles",
                    "onSale": "No disponibles",
                    "sold": "Vendidas",
                    "portfolioValue": "Valor del Portafolio",
                    "totalArv": "ARV Total",
                    "avgRoi": "ROI Prom.",
                    "active": "Propiedades Activas",
                    "interested": "Interesado",
                    "roi": "ROI Objetivo Prom."
                }
            },
            "properties": {
                "title": "Inventario de Propiedades",
                "subtitle": "Explora y gestiona las oportunidades inmobiliarias disponibles",
                "list": {
                    "title": "Inventario Disponible",
                    "total": "Total: {{count}} propiedades",
                    "loading": "Cargando propiedades...",
                    "noProperties": "No hay propiedades que coincidan con los criterios",
                    "arv": "ARV",
                    "rent": "Renta",
                    "gallery": "Galería de Fotos",
                    "filters": {
                        "title": "Filtros",
                        "searchPlaceholder": "Buscar por dirección, ciudad...",
                        "status": "Filtrar por estado",
                        "all": "Todas las Propiedades",
                        "available": "Disponibles",
                        "onSale": "No disponibles",
                        "sold": "Vendidas"
                    },
                    "status": {
                        "available": "Disponible",
                        "onSale": "No disponible",
                        "sold": "Vendida"
                    },
                    "beds": "Habitaciones",
                    "bed": "Habitacion",
                    "baths": "Baños",
                    "bath": "Baño",
                    "sqft": "Pies Cuadrados",
                    "labels": {
                        "rent": "Renta Mensual"
                    },
                    "actions": {
                        "view": "Ver Detalles",
                        "interest": "Me Interesa",
                        "removeInterest": "Quitar Interés",
                        "share": "Compartir PDF",
                        "sharing": "Generando...",
                        "pdfGenerating": "Generando reporte PDF...",
                        "shareSuccess": "PDF compartido con éxito",
                        "shareError": "Error al compartir PDF: "
                    },
                    "messages": {
                        "interestAdded": "¡Interés registrado! Te contactaremos pronto.",
                        "interestRemoved": "Interés eliminado exitosamente."
                    },
                    "delete": {
                        "title": "Eliminar Propiedad",
                        "description": "¿Estás seguro de que quieres eliminar \"{{title}}\"? Esta acción no se puede deshacer.",
                        "cancel": "Cancelar",
                        "confirm": "Eliminar"
                    }
                },
                "interests": {
                    "title": "Consultas"
                }
            },
            "admin": {
                "title": "Panel de Administración",
                "subtitle": "Gestiona usuarios y propiedades del sistema",
                "roleBadge": "Admin: {{email}}",
                "tabs": {
                    "overview": "Resumen",
                    "users": "Gestión de Usuarios",
                    "properties": "Inventario",
                    "interests": "Intereses"
                },
                "stats": {
                    "totalUsers": "Usuarios Totales",
                    "subtitleUsers": "Registrados en la plataforma",
                    "activeUsers": "Usuarios Activos",
                    "subtitleActiveUsers": "Aprobados y activos",
                    "subtitleProperties": "Inventario actual",
                    "subtitleInterests": "Intereses pendientes"
                },
                "actions": {
                    "title": "Acciones Rápidas",
                    "subtitle": "Tareas administrativas comunes",
                    "viewUsers": "Gestionar Usuarios",
                    "manageProperties": "Gestionar Inventario",
                    "systemSettings": "Ajustes del Sistema"
                },
                "activity": {
                    "title": "Actividad Reciente",
                    "subtitle": "Últimos eventos de la plataforma",
                    "loading": "Cargando actividad...",
                    "empty": "Sin actividad reciente",
                    "newUser": "Nuevo usuario: {{name}}",
                    "propertyCreated": "Propiedad creada: {{title}}",
                    "interestCreated": "{{name}} interesado en {{title}}"
                },
                "interests": {
                    "title": "Intereses en Propiedades",
                    "loading": "Cargando intereses...",
                    "registeredOn": "Registrado: {{date}}",
                    "empty": {
                        "title": "No hay intereses registrados",
                        "description": "Nadie ha mostrado interés en las propiedades todavía."
                    },
                    "status": {
                        "pending": "Pendiente",
                        "contacted": "Contactado",
                        "rejected": "Rechazado"
                    },
                    "actions": {
                        "contact": "Contactar",
                        "reject": "Rechazar",
                        "markPending": "Marcar Pendiente",
                        "reconsider": "Reconsiderar"
                    },
                    "messages": {
                        "loadingError": "Error al cargar intereses",
                        "updateError": "Error al actualizar estado",
                        "updateSuccess": "Estado actualizado exitosamente"
                    }
                },
                "properties": {
                    "title": "Gestión de Inventario",
                    "subtitle": "Crea, edita y elimina propiedades del catálogo",
                    "add": "Agregar Propiedad",
                    "addTitle": "Agregar Nueva Propiedad",
                    "editTitle": "Editar Propiedad",
                    "form": {
                        "titleEdit": "Editar Propiedad",
                        "titleNew": "Agregar Nueva Propiedad",
                        "description": "Completa los detalles a continuación para gestionar la información de la propiedad.",
                        "tabs": {
                            "basic": "Información Básica",
                            "financial": "Información Financiera",
                            "media": "Imágenes"
                        },
                        "sections": {
                            "manualInputs": "Entradas Manuales",
                            "automatedResults": "Resultados Financieros Automáticos",
                            "fixAndFlip": "Cálculos Fix & Flip",
                            "rent": "Cálculos de Renta"
                        },
                        "fields": {
                            "title": "Título",
                            "titlePlaceholder": "Ej: Casa de 3 habitaciones en el centro",
                            "type": "Tipo de Propiedad",
                            "typePlaceholder": "Ej: Casa, Apartamento, Terreno",
                            "address": "Dirección",
                            "addressPlaceholder": "Calle Principal #123",
                            "city": "Ciudad",
                            "state": "Estado",
                            "zipCode": "Código Postal",
                            "bedrooms": "Habitaciones",
                            "bathrooms": "Baños",
                            "sqft": "Metros Cuadrados",
                            "yearBuilt": "Año Construcción",
                            "description": "Descripción",
                            "descriptionPlaceholder": "Describe la propiedad...",
                            "status": "Estado",
                            "price": "Precio ($)",
                            "arv": "Valor Después de Reparación (ARV) ($)",
                            "roi": "ROI (%)",
                            "rehab": "Costo de Reparación ($)",
                            "rent": "Renta Mensual ($)",
                            "otherCosts": "Otros costos (cierre y mantenimiento) ($)",
                            "operatingExpenses": "Gastos Operativos Mensuales ($)",
                            "totalInvestment": "Inversión Total",
                            "netProfit": "Ganancia Neta",
                            "annualIncome": "Ingreso Anual",
                            "annualNoi": "NOI Anual",
                            "capRate": "Tasa de Capitalización (%)",
                            "images": "Imágenes de la Propiedad",
                            "imagesHint": "Puedes subir múltiples imágenes. La primera será la principal.",
                            "primary": "Principal"
                        },
                        "actions": {
                            "save": "Guardar Propiedad",
                            "saving": "Guardando...",
                            "update": "Actualizar Propiedad",
                            "create": "Crear Propiedad",
                            "uploadDesktop": "Cargar desde el escritorio",
                            "uploadDropbox": "Cargar desde Dropbox"
                        }
                    }
                },
                "users": {
                    "title": "Gestión de Usuarios",
                    "subtitle": "Administra todos los usuarios registrados y sus permisos",
                    "update": "Actualizar",
                    "loading": "Cargando usuarios...",
                    "registeredTitle": "Usuarios Registrados",
                    "total": "Total: {{count}} usuarios",
                    "table": {
                        "user": "Usuario",
                        "email": "Email",
                        "role": "Rol",
                        "status": "Estado",
                        "emailConfirmed": "Email Confirmado",
                        "lastLogin": "Último Login",
                        "actions": "Acciones"
                    },
                    "status": {
                        "approved": "Aprobado",
                        "pending": "Pendiente",
                        "never": "Nunca",
                        "noName": "Sin nombre"
                    },
                    "actions": {
                        "confirmEmail": "Confirmar Email",
                        "quickApprove": "Aprobar Rápido",
                        "changeRole": "Cambiar Rol",
                        "generateCode": "Generar Código",
                        "delete": "Eliminar"
                    },
                    "dialogs": {
                        "role": {
                            "title": "Gestionar Usuario",
                            "description": "Gestiona el rol y aprobación de {{name}}",
                            "label": "Nuevo Rol",
                            "approve": "Aprobar",
                            "reject": "Rechazar",
                            "update": "Actualizar Rol"
                        },
                        "code": {
                            "title": "Generar Código de Admin",
                            "description": "Genera un código para que {{name}} pueda registrarse como administrador",
                            "generatedLabel": "Código generado:",
                            "copyHint": "Copia este código y compártelo con el usuario",
                            "generate": "Generar Código",
                            "close": "Cerrar"
                        }
                    },
                    "messages": {
                        "roleUpdated": "Rol de {{name}} actualizado a {{role}}",
                        "approved": "Usuario {{name}} aprobado exitosamente",
                        "approvedWithEmail": "✅ Usuario {{name}} aprobado exitosamente. Email confirmado: {{status}}",
                        "rejected": "Usuario {{name}} rechazado",
                        "emailConfirmed": "Email confirmado exitosamente",
                        "codeGenerated": "Código generado para {{name}}: {{code}}",
                        "deleteConfirm": "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
                        "deleted": "Usuario eliminado exitosamente",
                        "partial": "Parcialmente",
                        "yes": "Sí",
                        "sendReset": "Enviar Reset Email",
                        "resetSent": "Email de restablecimiento enviado a {{email}}"
                    }
                }
            },
            "common": {
                "language": "Idioma",
                "loading": "Cargando...",
                "cancel": "Cancelar",
                "confirm": "Confirmar"
            },
            "login": {
                "title": "Inventario de Propiedades",
                "subtitle": "Accede al portal inmobiliario premium",
                "signIn": "Iniciar Sesión",
                "signUp": "Crear Cuenta",
                "email": "Correo Electrónico",
                "password": "Contraseña",
                "forgotPassword": "¿Olvidaste tu contraseña?",
                "signingIn": "Iniciando sesión...",
                "fullName": "Nombre Completo",
                "creating": "Creando cuenta...",
                "createAccount": "Registrarse",
                "loginFailed": "Error al iniciar sesión: ",
                "loginSuccess": "Sesión iniciada correctamente",
                "signUpFailed": "Error al registrarse: ",
                "signUpSuccess": "Revisa tu correo para confirmar tu cuenta",
                "backToLogin": "Volver al inicio",
                "phone": "Número de teléfono",
                "phonePlaceholder": "Ej. 300 123 4567",
                "phoneInvalid": "Ingresa un número de teléfono válido"
            },
            "resetPassword": {
                "title": "Recuperar Contraseña",
                "description": "Ingresa tu correo para recibir un enlace de restablecimiento",
                "emailLabel": "Correo Electrónico",
                "sending": "Enviando enlace...",
                "sendButton": "Enviar Enlace",
                "error": "Error: ",
                "success": "¡Enlace enviado! Revisa tu bandeja de entrada",
                "newPasswordTitle": "Crear Nueva Contraseña",
                "newPasswordDescription": "Ingresa tu nueva contraseña a continuación",
                "passwordLabel": "Nueva Contraseña",
                "confirmPasswordLabel": "Confirmar Nueva Contraseña",
                "updating": "Actualizando...",
                "updateButton": "Actualizar Contraseña",
                "passwordMismatch": "Las contraseñas no coinciden",
                "passwordMinLength": "La contraseña debe tener al menos 6 caracteres",
                "updateError": "Error al actualizar: ",
                "updateSuccess": "Contraseña actualizada correctamente"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'],
        load: 'languageOnly',
        detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
