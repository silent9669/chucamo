import { useEffect } from "react";
import { getEnvironmentConfig, logEnvironmentInfo, forceUniversalProtection } from "../utils/ipUtils";

export default function useCopyWatermark(protectedSelectors = []) {
  useEffect(() => {
    // Log environment information for debugging
    logEnvironmentInfo();
    
    const config = getEnvironmentConfig();
    
    // Force universal protection
    const isUniversalProtection = forceUniversalProtection();
    
    const handleCopy = (e) => {
      try {
        // Check if there's a selection
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return; // No selection, allow normal copy
        }

        // Check if selection is within protected content areas
        let isProtectedContent = false;
        
        if (protectedSelectors.length > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          
          // Check if selection is within any protected selector
          isProtectedContent = protectedSelectors.some(selector => {
            try {
              const element = container.nodeType === Node.TEXT_NODE 
                ? container.parentElement 
                : container;
              return element && element.closest(selector);
            } catch (error) {
              console.warn('Error checking selector:', selector, error);
              return false;
            }
          });
        } else {
          // If no selectors specified, protect all content
          isProtectedContent = true;
        }

        // Enhanced protection: Also check if selection contains substantial text content
        if (!isProtectedContent) {
          const selectedText = selection.toString().trim();
          // If selection has substantial content (more than 10 characters), protect it
          if (selectedText.length > 10) {
            isProtectedContent = true;
          }
        }

        // Universal protection: If enabled, protect all substantial text selections
        if (isUniversalProtection && !isProtectedContent) {
          const selectedText = selection.toString().trim();
          if (selectedText.length > 5) { // Lower threshold for universal protection
            isProtectedContent = true;
          }
        }

        // Only apply watermark to protected content
        if (isProtectedContent) {
          // Prevent normal copy behavior
          e.preventDefault();

          // Use environment-specific watermark text
          const watermark = config.watermarkText;
          const contentToCopy = watermark;

          // Set clipboard content with enhanced formatting
          e.clipboardData.setData("text/plain", contentToCopy);
          e.clipboardData.setData("text/html", `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 10px; border: 1px solid #ccc; background: #f9f9f9;">
              <strong>${contentToCopy}</strong>
            </div>
          `);
          
          // Optional: Show a brief notification
          showCopyNotification();
        }
        // If not protected content, allow normal copy behavior
      } catch (error) {
        console.warn('Error in copy watermark handler:', error);
        // If there's an error, allow normal copy behavior
      }
    };

    // Enhanced right-click context menu prevention
    const handleContextMenu = (e) => {
      // Check if right-click is on protected content
      let isProtectedContent = false;
      
      if (protectedSelectors.length > 0) {
        isProtectedContent = protectedSelectors.some(selector => {
          try {
            return e.target.closest(selector);
          } catch (error) {
            return false;
          }
        });
      } else {
        isProtectedContent = true;
      }

      // Enhanced protection: Check if right-click is on text content
      if (!isProtectedContent) {
        const target = e.target;
        if (target && (target.textContent || target.innerText)) {
          const textContent = (target.textContent || target.innerText).trim();
          if (textContent.length > 10) {
            isProtectedContent = true;
          }
        }
      }

      // Universal protection: If enabled, protect all text content
      if (isUniversalProtection && !isProtectedContent) {
        const target = e.target;
        if (target && (target.textContent || target.innerText)) {
          const textContent = (target.textContent || target.innerText).trim();
          if (textContent.length > 5) { // Lower threshold for universal protection
            isProtectedContent = true;
          }
        }
      }

      if (isProtectedContent) {
        // Show custom context menu or prevent default
        e.preventDefault();
        showCustomContextMenu(e);
      }
    };

    // Prevent keyboard shortcuts for copy in protected areas
    const handleKeyDown = (e) => {
      // Check if Ctrl+C or Cmd+C is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          
          let isProtectedContent = false;
          
          if (protectedSelectors.length > 0) {
            isProtectedContent = protectedSelectors.some(selector => {
              try {
                const element = container.nodeType === Node.TEXT_NODE 
                  ? container.parentElement 
                  : container;
                return element && element.closest(selector);
              } catch (error) {
                return false;
              }
            });
          } else {
            isProtectedContent = true;
          }

          // Enhanced protection: Check if selection has substantial content
          if (!isProtectedContent) {
            const selectedText = selection.toString().trim();
            if (selectedText.length > 10) {
              isProtectedContent = true;
            }
          }

          // Universal protection: If enabled, protect all substantial text selections
          if (isUniversalProtection && !isProtectedContent) {
            const selectedText = selection.toString().trim();
            if (selectedText.length > 5) { // Lower threshold for universal protection
              isProtectedContent = true;
            }
          }

          if (isProtectedContent) {
            e.preventDefault();
            e.stopPropagation();
            
            // Trigger our custom copy handler
            const copyEvent = new Event('copy', { bubbles: true, cancelable: true });
            document.dispatchEvent(copyEvent);
          }
        }
      }
    };

    // Enhanced clipboard API support for better cross-browser compatibility
    const handleClipboardWrite = async (e) => {
      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return;
        }

        let isProtectedContent = false;
        
        if (protectedSelectors.length > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          
          isProtectedContent = protectedSelectors.some(selector => {
            try {
              const element = container.nodeType === Node.TEXT_NODE 
                ? container.parentElement 
                : container;
              return element && element.closest(selector);
            } catch (error) {
              return false;
            }
          });
        } else {
          isProtectedContent = true;
        }

        // Enhanced protection: Check if selection has substantial content
        if (!isProtectedContent) {
          const selectedText = selection.toString().trim();
          if (selectedText.length > 10) {
            isProtectedContent = true;
          }
        }

        // Universal protection: If enabled, protect all substantial text selections
        if (isUniversalProtection && !isProtectedContent) {
          const selectedText = selection.toString().trim();
          if (selectedText.length > 5) { // Lower threshold for universal protection
            isProtectedContent = true;
          }
        }

        if (isProtectedContent && navigator.clipboard && navigator.clipboard.writeText) {
          e.preventDefault();
          
          try {
            await navigator.clipboard.writeText(config.watermarkText);
            showCopyNotification();
          } catch (clipboardError) {
            console.warn('Clipboard API failed, falling back to event method:', clipboardError);
            // Fall back to the event-based method
            const copyEvent = new Event('copy', { bubbles: true, cancelable: true });
            document.dispatchEvent(copyEvent);
          }
        }
      } catch (error) {
        console.warn('Error in clipboard write handler:', error);
      }
    };

    // Helper function to show copy notification
    const showCopyNotification = () => {
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.textContent = `Content protected with ${config.watermarkText}`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
      `;
      
      // Add animation CSS
      if (!document.getElementById('copy-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'copy-notification-styles';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    };

    // Helper function to show custom context menu
    const showCustomContextMenu = (e) => {
      // Create custom context menu
      const menu = document.createElement('div');
      menu.innerHTML = `
        <div style="
          position: fixed;
          left: ${e.pageX}px;
          top: ${e.pageY}px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: Arial, sans-serif;
          font-size: 14px;
          min-width: 150px;
        ">
          <div style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666;">
            Content Protected
          </div>
          <div style="padding: 8px 12px; color: #999; font-size: 12px;">
            Copying is disabled for this content
          </div>
        </div>
      `;
      
      document.body.appendChild(menu);
      
      // Remove menu when clicking elsewhere
      const removeMenu = () => {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
        document.removeEventListener('click', removeMenu);
      };
      
      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 100);
    };

    // Add event listeners with enhanced support
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    
    // Add clipboard API event listener for better compatibility
    if (navigator.clipboard) {
      document.addEventListener("copy", handleClipboardWrite);
    }
    
    // Debug logging for development
    if (config.debugMode) {
      console.log('Copy watermark hook initialized with:', {
        protectedSelectors,
        config,
        isUniversalProtection,
        timestamp: new Date().toISOString()
      });
    }
    
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      if (navigator.clipboard) {
        document.removeEventListener("copy", handleClipboardWrite);
      }
    };
  }, [protectedSelectors]);
}
