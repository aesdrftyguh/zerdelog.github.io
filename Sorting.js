class SortingTemplate {
    constructor(container, content, onSuccess, onFail) {
        this.container = container;
        this.content = content;
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.itemCount = content.items.length;
        this.placedCount = 0;
        this.render(); // Required by TaskRunner (see line 44)
    }

    render() {
        this.container.style.width = '100%';
        this.container.style.height = '100%'; // Full height again
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'space-between';
        this.container.style.boxSizing = 'border-box';

        // 1. Render Drop Zones (Bigger!)
        const zonesContainer = document.createElement('div');
        zonesContainer.className = 'sorting-zones';
        zonesContainer.style.display = 'flex';
        zonesContainer.style.justifyContent = 'center';
        zonesContainer.style.gap = '60px'; /* Bigger gap */
        zonesContainer.style.width = '100%';
        zonesContainer.style.marginTop = '40px';

        this.content.zones.forEach(zone => {
            const zoneEl = document.createElement('div');
            zoneEl.className = 'glass-panel drop-zone';
            zoneEl.dataset.id = zone.id;
            zoneEl.dataset.accept = JSON.stringify(zone.accept);

            zoneEl.innerHTML = `
                <div style="font-size: clamp(3rem, 8vw, 5rem); margin-bottom: 24px;">${zone.icon}</div>
                <div style="font-weight: 800; font-size: clamp(1rem, 2.5vw, 1.5rem); color: #4b5563;">${zone.label}</div>
            `;

            // Flex styles for zone - responsive
            zoneEl.style.width = 'clamp(140px, 25vw, 180px)';
            zoneEl.style.height = 'clamp(180px, 35vw, 240px)';
            zoneEl.style.display = 'flex';
            zoneEl.style.flexDirection = 'column';
            zoneEl.style.alignItems = 'center';
            zoneEl.style.justifyContent = 'center';
            zoneEl.style.transition = 'transform 0.2s, border 0.2s';
            zoneEl.style.background = 'white';
            zoneEl.style.border = '2px dashed #cbd5e1';
            zoneEl.style.borderRadius = '20px';

            this.enableDrop(zoneEl);
            zonesContainer.appendChild(zoneEl);
        });

        // 2. Render Draggable Items (Responsive!)
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'sorting-items';
        itemsContainer.style.display = 'flex';
        itemsContainer.style.gap = 'clamp(20px, 4vw, 40px)';
        itemsContainer.style.justifyContent = 'center';
        itemsContainer.style.padding = 'clamp(20px, 4vw, 40px)';
        itemsContainer.style.background = 'rgba(255,255,255,0.5)';
        itemsContainer.style.borderRadius = '30px';
        itemsContainer.style.alignSelf = 'center';
        itemsContainer.style.flexWrap = 'wrap'; // Allow wrapping on small screens

        this.content.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'glass-button draggable-item pop-in';
            itemEl.draggable = true;
            itemEl.dataset.type = item.type;
            itemEl.innerHTML = item.content;
            itemEl.style.fontSize = 'clamp(2.5rem, 6vw, 4rem)'; // Responsive icons
            itemEl.style.padding = 'clamp(15px, 3vw, 20px)';
            itemEl.style.width = 'clamp(70px, 15vw, 100px)';
            itemEl.style.height = 'clamp(70px, 15vw, 100px)';
            itemEl.style.display = 'flex';
            itemEl.style.justifyContent = 'center';
            itemEl.style.alignItems = 'center';
            itemEl.style.cursor = 'grab';
            itemEl.style.background = 'white';
            itemEl.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            itemEl.style.borderRadius = '24px';
            itemEl.style.touchAction = 'none'; // Critical for touch drag

            this.enableDrag(itemEl);
            itemsContainer.appendChild(itemEl);
        });

        this.container.appendChild(zonesContainer);
        this.container.appendChild(itemsContainer);
    }

    enableDrag(el) {
        // Desktop Drag
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', el.dataset.type);
            window.draggedElement = el;
            el.style.opacity = '0.4';
        });

        el.addEventListener('dragend', () => {
            el.style.opacity = '1';
            window.draggedElement = null;
        });

        // Touch Drag
        el.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;

            // Create a clone for visual feedback
            const clone = el.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = (touch.clientX - 50) + 'px'; // Center roughly
            clone.style.top = (touch.clientY - 50) + 'px';
            clone.style.width = '100px';
            clone.style.height = '100px';
            clone.style.opacity = '0.9';
            clone.style.zIndex = '1000';
            clone.style.pointerEvents = 'none'; // Critical for elementFromPoint
            clone.style.transform = 'scale(1.1)';
            document.body.appendChild(clone);

            this.dragClone = clone;
            this.activeTouchElement = el;
            el.style.opacity = '0.3';
        }, { passive: false });

        el.addEventListener('touchmove', (e) => {
            if (!this.activeTouchElement || !this.dragClone) return;
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];

            // Move clone
            this.dragClone.style.left = (touch.clientX - 50) + 'px';
            this.dragClone.style.top = (touch.clientY - 50) + 'px';

            // Find underlying element
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            this.lastTouchTarget = target;

            // Highlight potential zones
            const zones = this.container.querySelectorAll('.drop-zone');
            zones.forEach(z => {
                // Check if target is inside zone or is the zone
                if (z.contains(target) || z === target) {
                    z.style.transform = 'scale(1.05)';
                    z.style.borderColor = '#fbbf24';
                    z.style.background = '#fef3c7';
                } else {
                    z.style.transform = 'scale(1)';
                    z.style.borderColor = '#cbd5e1';
                    z.style.background = 'white';
                }
            });
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            if (!this.activeTouchElement) return;

            // Clean up clone
            if (this.dragClone) {
                this.dragClone.remove();
                this.dragClone = null;
            }

            el.style.opacity = '1';

            const target = this.lastTouchTarget;
            const zone = target ? target.closest('.drop-zone') : null;

            if (zone) {
                const type = el.dataset.type;
                const acceptedTypes = JSON.parse(zone.dataset.accept);
                if (acceptedTypes.includes(type)) {
                    this.handleCorrectDrop(zone);
                } else {
                    this.onFail();
                }
            }

            // Cleanup
            const zones = this.container.querySelectorAll('.drop-zone');
            zones.forEach(z => {
                z.style.transform = 'scale(1)';
                z.style.borderColor = '#cbd5e1';
                z.style.background = 'white';
            });

            this.activeTouchElement = null;
            window.draggedElement = null;
            this.lastTouchTarget = null;
        });
    }

    enableDrop(zone) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.transform = 'scale(1.05)';
            zone.style.borderColor = '#fbbf24';
            zone.style.background = '#fef3c7';
        });

        zone.addEventListener('dragleave', () => {
            zone.style.transform = 'scale(1)';
            zone.style.borderColor = '#cbd5e1';
            zone.style.background = 'white';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.transform = 'scale(1)';
            zone.style.borderColor = '#cbd5e1';
            zone.style.background = 'white';

            const type = e.dataTransfer.getData('text/plain');
            const acceptedTypes = JSON.parse(zone.dataset.accept);

            if (acceptedTypes.includes(type)) {
                this.handleCorrectDrop(zone);
            } else {
                this.onFail();
            }
        });
    }

    handleCorrectDrop(zone) {
        const el = window.draggedElement;
        if (el) {
            el.remove();
            const clone = document.createElement('div');
            clone.innerHTML = el.innerHTML;
            clone.style.fontSize = 'clamp(1.5rem, 5vw, 3rem)'; // Responsive icons inside
            clone.classList.add('pop-in');
            zone.appendChild(clone);
            this.placedCount++;
            if (window.SFX) SFX.playClick();
            if (this.placedCount === this.itemCount) {
                setTimeout(() => this.onSuccess(), 500);
            }
        }
    }
}
