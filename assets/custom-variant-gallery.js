//farooq
function initVariantGallery() {
  const galleryContainer = document.querySelector(".product__media-list");
  if (!galleryContainer) return;

  // Debounce mechanism to prevent rapid-fire execution
  let updateTimeout;
  let isUpdating = false;

  // Cache DOM elements for better performance
  let mediaItems = null;
  let thumbnails = null;

  function refreshDOMCache() {
    mediaItems = document.querySelectorAll(".product__media-item");
    thumbnails = document.querySelectorAll(".thumbnail-list__item");
  }

  // Function to update gallery based on selected color
  function updateGallery(selectedColor) {
    if (!selectedColor || isUpdating) return;

    // Clear any pending updates
    clearTimeout(updateTimeout);

    updateTimeout = setTimeout(() => {
      try {
        isUpdating = true;

        const lowerColor = selectedColor.toLowerCase();

        // Refresh DOM cache in case elements were added/removed
        refreshDOMCache();

        if (!mediaItems.length) return;

        let firstVisible = null;
        let visibleCount = 0;

        // Update main gallery images
        mediaItems.forEach((item, index) => {
          try {
            const img = item.querySelector("img");
            if (!img) return;

            const altText = img.alt ? img.alt.toLowerCase() : "";
            const shouldShow = altText.includes(lowerColor);

            // Update visibility
            item.style.display = shouldShow ? "" : "none";
            item.classList.remove("is-active");

            if (shouldShow) {
              visibleCount++;
              if (!firstVisible) firstVisible = item;
            }
          } catch (error) {
            // silent fail
          }
        });

        // Activate first visible item
        if (firstVisible) {
          firstVisible.classList.add("is-active");
        }

        // Update thumbnails
        let firstThumbVisible = null;

        thumbnails.forEach((thumb, index) => {
          try {
            const img = thumb.querySelector("img");
            if (!img) return;

            const thumbAlt = img.alt ? img.alt.toLowerCase() : "";
            const shouldShow = thumbAlt.includes(lowerColor);

            // Update visibility
            thumb.style.display = shouldShow ? "" : "none";
            thumb.classList.remove("is-active");

            if (shouldShow) {
              if (!firstThumbVisible) firstThumbVisible = thumb;
            }
          } catch (error) {
            // silent fail
          }
        });

        // Activate and scroll to first visible thumbnail
        if (firstThumbVisible) {
          firstThumbVisible.classList.add("is-active");

          // Smooth scroll to thumbnail
          try {
            firstThumbVisible.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest"
            });
          } catch (scrollError) {
            // silent fail
          }
        }

      } catch (error) {
        // silent fail
      } finally {
        isUpdating = false;
      }
    }, 100); // 100ms debounce
  }

  // Attach swatch click listeners with proper cleanup
  function attachSwatchListeners() {
    const swatches = document.querySelectorAll(".swatch-input__label");

    swatches.forEach((label, index) => {
      // Remove existing listener if present
      if (label._variantGalleryListener) {
        label.removeEventListener("click", label._variantGalleryListener);
        delete label._variantGalleryListener;
      }

      const listener = function(event) {
        const color = label.getAttribute("title") || label.innerText.trim();
        if (color) {
          updateGallery(color);
        }
      };

      label.addEventListener("click", listener);
      label._variantGalleryListener = listener;
    });
  }

  // Listen to Shopify's native variant change event
  document.addEventListener("variant:change", function(event) {
    try {
      const variant = event.detail?.variant;
      if (!variant) return;

      const colorOption = variant.option1;
      if (colorOption) {
        updateGallery(colorOption);
      }
    } catch (error) {
      // silent fail
    }
  });

  // Enhanced mutation observer for DOM changes
  const observer = new MutationObserver(function(mutations) {
    let shouldReattach = false;

    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const hasSwatchChanges = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && (
            node.classList?.contains('swatch-input__label') ||
            node.querySelector?.('.swatch-input__label')
          )
        );

        if (hasSwatchChanges) {
          shouldReattach = true;
        }
      }
    });

    if (shouldReattach) {
      setTimeout(() => {
        attachSwatchListeners();

        const selectedInput = document.querySelector(".swatch-input__input:checked");
        if (selectedInput) {
          const selectedLabel = document.querySelector(`label[for="${selectedInput.id}"]`);
          const color = selectedLabel?.getAttribute("title") || selectedLabel?.innerText.trim();
          if (color) {
            updateGallery(color);
          }
        }
      }, 50);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initialize
  refreshDOMCache();
  attachSwatchListeners();

  // Handle URL variant parameter on page load
  const url = new URL(window.location.href);
  const variantParam = url.searchParams.get("variant");

  if (variantParam) {
    setTimeout(() => {
      const selectedInput = document.querySelector(".swatch-input__input:checked");
      if (selectedInput) {
        const selectedLabel = document.querySelector(`label[for="${selectedInput.id}"]`);
        const color = selectedLabel?.getAttribute("title") || selectedLabel?.innerText.trim();
        if (color) {
          updateGallery(color);
        }
      }
    }, 100);
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initVariantGallery);
} else {
  initVariantGallery();
}
