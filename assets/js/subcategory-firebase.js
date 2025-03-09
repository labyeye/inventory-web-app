// Create a module to handle subcategory operations
// File: assets/js/subcategory-firebase.js

import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Get parent categories from Firestore
async function getParentCategories() {
  try {
    const categoriesRef = collection(db, "categories");
    const querySnapshot = await getDocs(categoriesRef);

    const selectElement = document.querySelector("select.select");
    // Clear existing options except the first one
    const defaultOption = selectElement.options[0];
    selectElement.innerHTML = "";
    selectElement.appendChild(defaultOption);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = data.name;
      selectElement.appendChild(option);
    });

    // Reinitialize select2 if it's being used
    $(selectElement).select2();
  } catch (error) {
    console.error("Error getting parent categories:", error);
    showAlert("error", "Failed to load parent categories");
  }
}

// Add subcategory to Firestore
async function addSubcategory(parentCategoryId, name, code, description) {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      window.location.href = "signin.html";
      return;
    }

    // Check if subcategory with same code already exists
    const subcategoriesRef = collection(db, "subcategories");
    const q = query(subcategoriesRef, where("code", "==", code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      showAlert("error", "Subcategory code already exists");
      return false;
    }

    // Add new subcategory
    await addDoc(collection(db, "subcategories"), {
      parentCategoryId,
      name,
      code,
      description,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });

    showAlert("success", "Subcategory added successfully");
    return true;
  } catch (error) {
    console.error("Error adding subcategory:", error);
    showAlert("error", "Failed to add subcategory");
    return false;
  }
}

// Show sweet alert
function showAlert(type, message) {
  Swal.fire({
    icon: type,
    title: type === "success" ? "Success" : "Error",
    text: message,
    showConfirmButton: true,
  });
}

// Initialize the page
function initSubcategoryPage() {
  // Load parent categories when page loads
  document.addEventListener("DOMContentLoaded", () => {
    getParentCategories();

    // Add event listener for form submission
    const submitBtn = document.querySelector(".btn-submit");
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Get all form inputs
      const formGroups = document.querySelectorAll(".form-group");

      // Log for debugging
      console.log("Found form groups:", formGroups.length);

      // Get elements by their position in the form
      const parentCategorySelect = formGroups[0].querySelector("select");
      const nameInput = formGroups[1].querySelector("input");
      const codeInput = formGroups[2].querySelector("input");
      const descriptionTextarea = formGroups[3].querySelector("textarea");

      // Log for debugging
      console.log("Form elements:", {
        parentCategorySelect,
        nameInput,
        codeInput,
        descriptionTextarea,
      });

      // Check if elements were found
      if (
        !parentCategorySelect ||
        !nameInput ||
        !codeInput ||
        !descriptionTextarea
      ) {
        console.error("Could not find form elements");
        showAlert(
          "error",
          "Form elements not found. Please check the console for details."
        );
        return;
      }

      const parentCategoryId = parentCategorySelect.value;
      const name = nameInput.value.trim();
      const code = codeInput.value.trim();
      const description = descriptionTextarea.value.trim();

      // Validate form
      if (parentCategoryId === "Choose Category") {
        showAlert("error", "Please select a parent category");
        return;
      }

      if (!name) {
        showAlert("error", "Please enter subcategory name");
        return;
      }

      if (!code) {
        showAlert("error", "Please enter subcategory code");
        return;
      }

      // Add subcategory to Firestore
      const success = await addSubcategory(
        parentCategoryId,
        name,
        code,
        description
      );

      if (success) {
        // Reset form
        parentCategorySelect.value = "Choose Category";
        nameInput.value = "";
        codeInput.value = "";
        descriptionTextarea.value = "";

        // Reinitialize select2 if it's being used
        $(parentCategorySelect).select2();

        // Redirect to subcategory list after successful addition
        setTimeout(() => {
          window.location.href = "subcategorylist.html";
        }, 1500);
      }
    });
  });
}

export { initSubcategoryPage };
