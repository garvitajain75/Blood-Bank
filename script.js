// Blood Bank Management System JavaScript

class BloodBankSystem {
    constructor() {
        this.donors = JSON.parse(localStorage.getItem("donors")) || []
        this.requests = JSON.parse(localStorage.getItem("requests")) || []
        this.bloodInventory = JSON.parse(localStorage.getItem("bloodInventory")) || this.initializeInventory()
        this.currentPage = "home"

        this.init()
    }

    init() {
        this.setupEventListeners()
        this.updateStats()
        this.renderBloodInventory()
        this.showPage("home")
        this.animateStatsOnLoad()
    }

    initializeInventory() {
        const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        const inventory = {}

        bloodGroups.forEach((group) => {
            inventory[group] = Math.floor(Math.random() * 80) + 10 // Random units between 10-90
        })

        localStorage.setItem("bloodInventory", JSON.stringify(inventory))
        return inventory
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault()
                const page = e.currentTarget.dataset.page
                this.showPage(page)
            })
        })

        // Hero buttons
        document.querySelectorAll("[data-page]").forEach((btn) => {
            if (!btn.classList.contains("nav-link")) {
                btn.addEventListener("click", (e) => {
                    const page = e.currentTarget.dataset.page
                    this.showPage(page)
                })
            }
        })

        // Mobile menu toggle
        const hamburger = document.querySelector(".hamburger")
        const navMenu = document.querySelector(".nav-menu")

        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active")
            navMenu.classList.toggle("active")
        })

        // Close mobile menu when clicking on a link
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active")
                navMenu.classList.remove("active")
            })
        })

        // Tab switching
        document.querySelectorAll(".tab-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const tabName = e.target.dataset.tab
                this.switchTab(tabName)
            })
        })

        // Form submissions
        document.getElementById("donor-form").addEventListener("submit", (e) => {
            e.preventDefault()
            this.handleDonorRegistration(e)
        })

        document.getElementById("request-form").addEventListener("submit", (e) => {
            e.preventDefault()
            this.handleBloodRequest(e)
        })

        // Modal close
        document.getElementById("modal-close").addEventListener("click", () => {
            this.closeModal()
        })

        // Close modal when clicking outside
        document.getElementById("success-modal").addEventListener("click", (e) => {
            if (e.target.id === "success-modal") {
                this.closeModal()
            }
        })
    }

    showPage(pageName) {
        // Update navigation
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.classList.remove("active")
        })
        document.querySelector(`[data-page="${pageName}"]`).classList.add("active")

        // Show page
        document.querySelectorAll(".page").forEach((page) => {
            page.classList.remove("active")
        })
        document.getElementById(pageName).classList.add("active")

        this.currentPage = pageName

        // Page-specific actions
        if (pageName === "donor") {
            this.loadDonorProfile()
        } else if (pageName === "availability") {
            this.renderBloodInventory()
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll(".tab-btn").forEach((btn) => {
            btn.classList.remove("active")
        })
        document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

        // Show tab content
        document.querySelectorAll(".tab-pane").forEach((pane) => {
            pane.classList.remove("active")
        })
        document.getElementById(tabName).classList.add("active")

        if (tabName === "profile") {
            this.loadDonorProfile()
        }
    }

    handleDonorRegistration(e) {
        const formData = new FormData(e.target)
        const donorData = {}

        // Get form data
        donorData.name = document.getElementById("donor-name").value.trim()
        donorData.email = document.getElementById("donor-email").value.trim()
        donorData.phone = document.getElementById("donor-phone").value.trim()
        donorData.age = Number.parseInt(document.getElementById("donor-age").value)
        donorData.bloodGroup = document.getElementById("donor-blood-group").value
        donorData.weight = Number.parseInt(document.getElementById("donor-weight").value)
        donorData.address = document.getElementById("donor-address").value.trim()
        donorData.terms = document.getElementById("donor-terms").checked
        donorData.registrationDate = new Date().toISOString()
        donorData.id = Date.now().toString()

        // Validate form
        if (!this.validateDonorForm(donorData)) {
            return
        }

        // Check if email already exists
        if (this.donors.find((donor) => donor.email === donorData.email)) {
            this.showError("donor-email", "Email already registered")
            return
        }

        // Save donor
        this.donors.push(donorData)
        localStorage.setItem("donors", JSON.stringify(this.donors))

        // Update blood inventory
        this.bloodInventory[donorData.bloodGroup] += 1
        localStorage.setItem("bloodInventory", JSON.stringify(this.bloodInventory))

        // Reset form
        e.target.reset()
        this.clearErrors()

        // Show success message
        this.showModal(
            "Registration Successful!",
            `Thank you ${donorData.name}! You have been registered as a blood donor.`,
        )

        // Update stats
        this.updateStats()
        this.renderBloodInventory()
    }

    validateDonorForm(data) {
        let isValid = true
        this.clearErrors()

        // Name validation
        if (!data.name || data.name.length < 2) {
            this.showError("donor-name", "Name must be at least 2 characters")
            isValid = false
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!data.email || !emailRegex.test(data.email)) {
            this.showError("donor-email", "Please enter a valid email address")
            isValid = false
        }

        // Phone validation
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
        if (!data.phone || !phoneRegex.test(data.phone.replace(/\s/g, ""))) {
            this.showError("donor-phone", "Please enter a valid phone number")
            isValid = false
        }

        // Age validation
        if (!data.age || data.age < 18 || data.age > 65) {
            this.showError("donor-age", "Age must be between 18 and 65")
            isValid = false
        }

        // Blood group validation
        if (!data.bloodGroup) {
            this.showError("donor-blood-group", "Please select a blood group")
            isValid = false
        }

        // Weight validation
        if (!data.weight || data.weight < 50) {
            this.showError("donor-weight", "Weight must be at least 50 kg")
            isValid = false
        }

        // Address validation
        if (!data.address || data.address.length < 10) {
            this.showError("donor-address", "Please provide a complete address")
            isValid = false
        }

        // Terms validation
        if (!data.terms) {
            this.showError("donor-terms", "You must agree to the terms and conditions")
            isValid = false
        }

        return isValid
    }

    handleBloodRequest(e) {
        const requestData = {}

        // Get form data
        requestData.patientName = document.getElementById("patient-name").value.trim()
        requestData.requesterName = document.getElementById("requester-name").value.trim()
        requestData.phone = document.getElementById("requester-phone").value.trim()
        requestData.bloodGroup = document.getElementById("required-blood-group").value
        requestData.unitsNeeded = Number.parseInt(document.getElementById("units-needed").value)
        requestData.urgency = document.getElementById("urgency").value
        requestData.hospitalAddress = document.getElementById("hospital-address").value.trim()
        requestData.medicalReason = document.getElementById("medical-reason").value.trim()
        requestData.requestDate = new Date().toISOString()
        requestData.id = Date.now().toString()
        requestData.status = "pending"

        // Validate form
        if (!this.validateRequestForm(requestData)) {
            return
        }

        // Check blood availability
        if (this.bloodInventory[requestData.bloodGroup] < requestData.unitsNeeded) {
            this.showError(
                "units-needed",
                `Only ${this.bloodInventory[requestData.bloodGroup]} units available for ${requestData.bloodGroup}`,
            )
            return
        }

        // Process request
        this.bloodInventory[requestData.bloodGroup] -= requestData.unitsNeeded
        localStorage.setItem("bloodInventory", JSON.stringify(this.bloodInventory))

        // Save request
        this.requests.push(requestData)
        localStorage.setItem("requests", JSON.stringify(this.requests))

        // Reset form
        e.target.reset()
        this.clearErrors()

        // Show success message
        this.showModal(
            "Request Submitted!",
            `Blood request for ${requestData.patientName} has been submitted successfully. You will be contacted soon.`,
        )

        // Update stats and inventory
        this.updateStats()
        this.renderBloodInventory()
    }

    validateRequestForm(data) {
        let isValid = true
        this.clearErrors()

        // Patient name validation
        if (!data.patientName || data.patientName.length < 2) {
            this.showError("patient-name", "Patient name is required")
            isValid = false
        }

        // Requester name validation
        if (!data.requesterName || data.requesterName.length < 2) {
            this.showError("requester-name", "Requester name is required")
            isValid = false
        }

        // Phone validation
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
        if (!data.phone || !phoneRegex.test(data.phone.replace(/\s/g, ""))) {
            this.showError("requester-phone", "Please enter a valid phone number")
            isValid = false
        }

        // Blood group validation
        if (!data.bloodGroup) {
            this.showError("required-blood-group", "Please select required blood group")
            isValid = false
        }

        // Units validation
        if (!data.unitsNeeded || data.unitsNeeded < 1 || data.unitsNeeded > 10) {
            this.showError("units-needed", "Units needed must be between 1 and 10")
            isValid = false
        }

        // Urgency validation
        if (!data.urgency) {
            this.showError("urgency", "Please select urgency level")
            isValid = false
        }

        // Hospital address validation
        if (!data.hospitalAddress || data.hospitalAddress.length < 10) {
            this.showError("hospital-address", "Please provide complete hospital address")
            isValid = false
        }

        return isValid
    }

    showError(fieldId, message) {
        const field = document.getElementById(fieldId)
        const errorSpan = field.parentNode.querySelector(".error-message")

        field.classList.add("error")
        errorSpan.textContent = message

        // Add shake animation
        field.style.animation = "shake 0.5s ease-in-out"
        setTimeout(() => {
            field.style.animation = ""
        }, 500)
    }

    clearErrors() {
        document.querySelectorAll(".error").forEach((field) => {
            field.classList.remove("error")
        })
        document.querySelectorAll(".error-message").forEach((span) => {
            span.textContent = ""
        })
    }

    loadDonorProfile() {
        const profileContainer = document.getElementById("donor-profile")

        if (this.donors.length === 0) {
            profileContainer.innerHTML = `
                <div class="no-profile">
                    <i class="fas fa-user-slash"></i>
                    <h3>No Profile Found</h3>
                    <p>Please register as a donor first</p>
                </div>
            `
            return
        }

        // Show the most recent donor (in a real app, this would be based on login)
        const donor = this.donors[this.donors.length - 1]

        profileContainer.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-info">
                    <h3>${donor.name}</h3>
                    <div class="profile-details">
                        <div class="profile-item">
                            <strong>Email:</strong>
                            ${donor.email}
                        </div>
                        <div class="profile-item">
                            <strong>Phone:</strong>
                            ${donor.phone}
                        </div>
                        <div class="profile-item">
                            <strong>Age:</strong>
                            ${donor.age} years
                        </div>
                        <div class="profile-item">
                            <strong>Blood Group:</strong>
                            <span style="color: var(--primary-color); font-weight: bold;">${donor.bloodGroup}</span>
                        </div>
                        <div class="profile-item">
                            <strong>Weight:</strong>
                            ${donor.weight} kg
                        </div>
                        <div class="profile-item">
                            <strong>Registration Date:</strong>
                            ${new Date(donor.registrationDate).toLocaleDateString()}
                        </div>
                        <div class="profile-item">
                            <strong>Address:</strong>
                            ${donor.address}
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderBloodInventory() {
        const inventoryGrid = document.getElementById("inventory-grid")
        const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

        inventoryGrid.innerHTML = ""

        bloodGroups.forEach((group, index) => {
            const units = this.bloodInventory[group]
            const status = this.getStockStatus(units)

            const card = document.createElement("div")
            card.className = "blood-card"
            card.style.animationDelay = `${index * 0.1}s`

            card.innerHTML = `
                <div class="blood-group">${group}</div>
                <div class="blood-units">${units} Units</div>
                <div class="stock-status stock-${status.level}">${status.text}</div>
            `

            inventoryGrid.appendChild(card)
        })
    }

    getStockStatus(units) {
        if (units >= 50) {
            return { level: "high", text: "High Stock" }
        } else if (units >= 20) {
            return { level: "medium", text: "Medium Stock" }
        } else if (units >= 5) {
            return { level: "low", text: "Low Stock" }
        } else {
            return { level: "critical", text: "Critical" }
        }
    }

    updateStats() {
        const totalDonors = this.donors.length
        const totalUnits = Object.values(this.bloodInventory).reduce((sum, units) => sum + units, 0)
        const totalRequests = this.requests.length

        this.animateCounter("total-donors", totalDonors)
        this.animateCounter("total-units", totalUnits)
        this.animateCounter("total-requests", totalRequests)
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId)
        const startValue = 0
        const duration = 2000
        const startTime = performance.now()

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            const currentValue = Math.floor(startValue + (targetValue - startValue) * this.easeOutCubic(progress))
            element.textContent = currentValue

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3)
    }

    animateStatsOnLoad() {
        setTimeout(() => {
            this.updateStats()
        }, 500)
    }

    showModal(title, message) {
        document.getElementById("modal-title").textContent = title
        document.getElementById("modal-message").textContent = message
        document.getElementById("success-modal").style.display = "block"
    }

    closeModal() {
        document.getElementById("success-modal").style.display = "none"
    }
}

// Add shake animation CSS
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`

const style = document.createElement("style")
style.textContent = shakeCSS
document.head.appendChild(style)

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    new BloodBankSystem()
})

// Add some sample data for demonstration
window.addEventListener("load", () => {
    // Add sample donors if none exist
    const existingDonors = JSON.parse(localStorage.getItem("donors")) || []
    if (existingDonors.length === 0) {
        const sampleDonors = [
            {
                id: "1",
                name: "John Doe",
                email: "john@example.com",
                phone: "+1234567890",
                age: 25,
                bloodGroup: "O+",
                weight: 70,
                address: "123 Main St, City, State",
                terms: true,
                registrationDate: new Date().toISOString(),
            },
            {
                id: "2",
                name: "Jane Smith",
                email: "jane@example.com",
                phone: "+1234567891",
                age: 30,
                bloodGroup: "A+",
                weight: 65,
                address: "456 Oak Ave, City, State",
                terms: true,
                registrationDate: new Date().toISOString(),
            },
        ]
        localStorage.setItem("donors", JSON.stringify(sampleDonors))
    }
})
