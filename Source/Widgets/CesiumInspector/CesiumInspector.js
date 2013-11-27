/*global define*/
define([
        '../../Core/defined',
        '../../Core/defineProperties',
        '../../Core/destroyObject',
        '../../Core/BoundingRectangle',
        '../../Core/Color',
        '../../Core/DeveloperError',
        '../../Scene/PerformanceDisplay',
        '../../Scene/DebugModelMatrixPrimitive',
        '../getElement',
        './CesiumInspectorViewModel',
        '../../ThirdParty/knockout'
    ], function(
        defined,
        defineProperties,
        destroyObject,
        BoundingRectangle,
        Color,
        DeveloperError,
        PerformanceDisplay,
        DebugModelMatrixPrimitive,
        getElement,
        CesiumInspectorViewModel,
        knockout) {
    "use strict";

    /**
     * Inspector widget to aid in debugging
     *
     * @alias CesiumInspector
     * @constructor
     *
     * @param {Element|String} container The DOM element or ID that will contain the widget.
     * @param {Scene} scene The Scene instance to use.
     *
     * @exception {DeveloperError} container is required.
     * @exception {DeveloperError} scene is required.
     */

    var CesiumInspector = function(container, scene, canvas) {
        if (!defined(container)) {
            throw new DeveloperError('container is required.');
        }

        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }

        container = getElement(container);

        var viewModel = new CesiumInspectorViewModel(scene, canvas);
        this._viewModel = viewModel;
        this._container = container;

        var element = document.createElement('div');
        this._element = element;
        var text = document.createElement('div');
        text.textContent = 'Cesium Inspector';
        text.className = 'cesium-cesiumInspector-button';
        text.setAttribute('data-bind', 'click: toggleDropDown');
        element.appendChild(text);
        element.className = 'cesium-cesiumInspector';
        element.setAttribute('data-bind', 'css: { "cesium-cesiumInspector-visible" : dropDownVisible, "cesium-cesiumInspector-hidden" : !dropDownVisible }');
        container.appendChild(this._element);

        var panel = document.createElement('div');
        this._panel = panel;
        panel.className = 'cesium-cesiumInspector-dropDown';
        element.appendChild(panel);

        // General
        var general = document.createElement('div');
        general.className = 'cesium-cesiumInspector-sectionHeader';
        general.textContent = 'General';
        panel.appendChild(general);

        var generalSection = document.createElement('div');
        generalSection.className = 'cesium-cesiumInspector-section';
        panel.appendChild(generalSection);
        var debugShowFrustums = document.createElement('div');
        generalSection.appendChild(debugShowFrustums);
        var frustumStats = document.createElement('div');
        frustumStats.className = 'cesium-cesiumInspector-frustumStats';
        frustumStats.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : showFrustums, "cesium-cesiumInspector-hide" : !showFrustums}, html: frustumStatText');
        var frustumsCheckbox = document.createElement('input');
        frustumsCheckbox.type = 'checkbox';
        frustumsCheckbox.setAttribute('data-bind', 'checked: showFrustums, click: toggleFrustums');
        debugShowFrustums.appendChild(frustumsCheckbox);
        debugShowFrustums.appendChild(document.createTextNode('Show Frustums'));
        debugShowFrustums.appendChild(frustumStats);

        var performanceDisplay = document.createElement('div');
        generalSection.appendChild(performanceDisplay);
        var pdCheckbox = document.createElement('input');
        pdCheckbox.type = 'checkbox';
        pdCheckbox.setAttribute('data-bind', 'checked: showPerformance, click: togglePerformance');
        performanceDisplay.appendChild(pdCheckbox);
        performanceDisplay.appendChild(document.createTextNode('Performance Display'));

        // Primitives
        var prim = document.createElement('div');
        prim.className = 'cesium-cesiumInspector-sectionHeader';
        prim.innerHTML = 'Primitives';
        panel.appendChild(prim);

        var primitivesSection = document.createElement('div');
        primitivesSection.className = 'cesium-cesiumInspector-section';
        panel.appendChild(primitivesSection);
        var pickPrimRequired = document.createElement('div');
        pickPrimRequired.className = 'cesium-cesiumInspector-pickSection';
        primitivesSection.appendChild(pickPrimRequired);

        var pickPrimitiveButton = document.createElement('input');
        pickPrimitiveButton.type = 'button';
        pickPrimitiveButton.value = 'Pick a primitive';
        pickPrimitiveButton.className = 'cesium-cesiumInspector-pickButton';
        pickPrimitiveButton.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-pickButtonHighlight" : pickPrimitiveActive}, click: pickPrimitive');
        var buttonWrap = document.createElement('div');
        buttonWrap.className = 'cesium-cesiumInspector-center';
        buttonWrap.appendChild(pickPrimitiveButton);
        pickPrimRequired.appendChild(buttonWrap);

        var debugSphere = document.createElement('div');
        pickPrimRequired.appendChild(debugSphere);
        var bsCheckbox = document.createElement('input');
        bsCheckbox.type = 'checkbox';
        bsCheckbox.setAttribute('data-bind', 'checked: showBoundingSphere, click: toggleBoundingSphere, enable: hasPickedPrimitive');
        debugSphere.appendChild(bsCheckbox);
        debugSphere.appendChild(document.createTextNode('Show bounding sphere'));

        var refFrame = document.createElement('div');
        pickPrimRequired.appendChild(refFrame);
        var rfCheckbox = document.createElement('input');
        rfCheckbox.type = 'checkbox';
        rfCheckbox.setAttribute('data-bind', 'checked: showRefFrame, click: toggleRefFrame, enable: hasPickedPrimitive');
        refFrame.appendChild(rfCheckbox);
        refFrame.appendChild(document.createTextNode('Show reference frame'));

        var primitiveOnly = document.createElement('div');
        this._primitiveOnly = primitiveOnly;
        pickPrimRequired.appendChild(primitiveOnly);
        var primitiveOnlyCheckbox = document.createElement('input');
        primitiveOnlyCheckbox.type = 'checkbox';
        primitiveOnlyCheckbox.setAttribute('data-bind', 'checked: filterPrimitive, click: toggleFilterPrimitive, enable: hasPickedPrimitive');
        primitiveOnly.appendChild(primitiveOnlyCheckbox);
        primitiveOnly.appendChild(document.createTextNode('Show only selected'));

        // Terrain
        var terrain = document.createElement('div');
        terrain.className = 'cesium-cesiumInspector-sectionHeader';
        terrain.innerHTML = 'Terrain';
        panel.appendChild(terrain);

        var terrainSection = document.createElement('div');
        terrainSection.className = 'cesium-cesiumInspector-section';
        panel.appendChild(terrainSection);
        var pickTileRequired = document.createElement('div');
        pickTileRequired.className = 'cesium-cesiumInspector-pickSection';
        terrainSection.appendChild(pickTileRequired);
        var pickTileButton = document.createElement('input');
        pickTileButton.type = 'button';
        pickTileButton.value = 'Pick a tile';
        pickTileButton.className = 'cesium-cesiumInspector-pickButton';
        pickTileButton.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-pickButtonHighlight" : pickTileActive}, click: pickTile');
        buttonWrap = document.createElement('div');
        buttonWrap.appendChild(pickTileButton);
        buttonWrap.className = 'cesium-cesiumInspector-center';
        pickTileRequired.appendChild(buttonWrap);
        var tileInfo = document.createElement('div');
        pickTileRequired.appendChild(tileInfo);
        var tileText = document.createElement('div');
        tileInfo.className = 'cesium-cesiumInspector-frustumStats';
        tileInfo.appendChild(tileText);
        tileInfo.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : hasPickedTile, "cesium-cesiumInspector-hide" : !hasPickedTile}');
        tileText.setAttribute('data-bind', 'html: tileText');

        var tileBoundingSphere = document.createElement('div');
        pickTileRequired.appendChild(tileBoundingSphere);
        var tbsCheck = document.createElement('input');
        tbsCheck.type = 'checkbox';
        tbsCheck.setAttribute('data-bind', 'checked: tileBoundingSphere, enable: hasPickedTile, click: toggleTileBoundingSphere');
        tileBoundingSphere.appendChild(tbsCheck);
        tileBoundingSphere.appendChild(document.createTextNode('Show bounding sphere'));

        var renderTile = document.createElement('div');
        pickTileRequired.appendChild(renderTile);
        var rCheck = document.createElement('input');
        rCheck.type = 'checkbox';
        rCheck.setAttribute('data-bind', 'checked: filterTile, enable: hasPickedTile, click: toggleRenderTile');
        renderTile.appendChild(rCheck);
        renderTile.appendChild(document.createTextNode('Show only selected'));

        var wireframe = document.createElement('div');
        terrainSection.appendChild(wireframe);
        var wCheckbox = document.createElement('input');
        wCheckbox.type = 'checkbox';
        wCheckbox.setAttribute('data-bind', 'checked: wireframe, click: toggleWireframe');
        wireframe.appendChild(wCheckbox);
        wireframe.appendChild(document.createTextNode('Wireframe'));

        var suspendUpdates = document.createElement('div');
        terrainSection.appendChild(suspendUpdates);
        var upCheckbox = document.createElement('input');
        upCheckbox.type = 'checkbox';
        upCheckbox.setAttribute('data-bind', 'checked: suspendUpdates, click: toggleSuspendUpdates');
        suspendUpdates.appendChild(upCheckbox);
        suspendUpdates.appendChild(document.createTextNode('Suspend LOD update'));

        var tileCoords = document.createElement('div');
        terrainSection.appendChild(tileCoords);
        var coordCheck = document.createElement('input');
        coordCheck.type = 'checkbox';
        coordCheck.setAttribute('data-bind', 'checked: showTileCoords, click: toggleShowTileCoords');
        tileCoords.appendChild(coordCheck);
        tileCoords.appendChild(document.createTextNode('Show tile coordinates'));



        knockout.applyBindings(viewModel, this._element);
    };

    defineProperties(CesiumInspector.prototype, {
        /**
         * Gets the parent container.
         * @memberof BaseLayerPicker.prototype
         *
         * @type {Element}
         */
        container : {
            get : function() {
                return this._container;
            }
        },

        /**
         * Gets the view model.
         * @memberof BaseLayerPicker.prototype
         *
         * @type {BaseLayerPickerViewModel}
         */
        viewModel : {
            get : function() {
                return this._viewModel;
            }
        }
    });

    /**
     * @memberof BaseLayerPicker
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    CesiumInspector.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the widget.  Should be called if permanently
     * removing the widget from layout.
     * @memberof BaseLayerPicker
     */
    CesiumInspector.prototype.destroy = function() {
        knockout.cleanNode(this._element);
        knockout.cleanNode(this._panel);
        var container = this._container;
        container.removeChild(this._element);
        container.removeChild(this._panel);
        return destroyObject(this);
    };

    return CesiumInspector;
});