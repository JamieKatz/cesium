/*global define*/
define([
        '../../Core/Cartesian2',
        '../../Core/defaultValue',
        '../../Core/defineProperties',
        '../../Core/DeveloperError',
        '../../ThirdParty/knockout'
    ], function(
        Cartesian2,
        defaultValue,
        defineProperties,
        DeveloperError,
        knockout) {
    "use strict";

    var screenPosition = new Cartesian2();
    var pointMin = 0;

    function shiftPosition(viewModel, position){
        var pointX;
        var pointY;
        var posX;
        var posY;

        var containerWidth = viewModel._container.clientWidth;
        var containerHeight = viewModel._container.clientHeight;

        viewModel._maxWidth = Math.floor(viewModel._container.clientWidth*0.25) + 'px';
        viewModel._maxHeight = Math.floor(viewModel._container.clientHeight*0.25) + 'px';

        var pointMaxY = containerHeight - 15;
        var pointMaxX = containerWidth - 16;
        var pointXOffset = position.x - 15;

        var width = viewModel._balloonElement.offsetWidth;
        var height = viewModel._balloonElement.offsetHeight;

        var posMaxY = containerHeight - height;
        var posMaxX = containerWidth - width - 2;
        var posMin = 0;
        var posXOffset = position.x - width/2;

        var top = position.y > containerHeight;
        var bottom = position.y < -10;
        var left = position.x < 0;
        var right = position.x > containerWidth;

        if (bottom) {
            posX = Math.min(Math.max(posXOffset, posMin), posMaxX);
            posY = 15;
            pointX = Math.min(Math.max(pointXOffset, pointMin), pointMaxX);
            pointY = pointMin;
            viewModel._down = true;
            viewModel._up = false;
            viewModel._left = false;
            viewModel._right = false;
        } else if (top) {
            posX = Math.min(Math.max(posXOffset, posMin), posMaxX);
            posY = containerHeight - height - 14;
            pointX = Math.min(Math.max(pointXOffset, pointMin), pointMaxX);
            pointY = pointMaxY;
            viewModel._down = false;
            viewModel._up = true;
            viewModel._left = false;
            viewModel._right = false;
        } else if (left) {
            posX = 15;
            posY = Math.min(Math.max((position.y - height/2), posMin), posMaxY);
            pointX = pointMin;
            pointY = Math.min(Math.max((position.y - 15), pointMin), pointMaxY);
            viewModel._down = false;
            viewModel._up = false;
            viewModel._left = true;
            viewModel._right = false;
        } else if (right) {
            posX = containerWidth - width - 15;
            posY = Math.min(Math.max((position.y - height/2), posMin), posMaxY);
            pointX = pointMaxX;
            pointY = Math.min(Math.max((position.y - 15), pointMin), pointMaxY);
            viewModel._down = false;
            viewModel._up = false;
            viewModel._left = false;
            viewModel._right = true;
        } else {
            posX = Math.min(Math.max(posXOffset, posMin), posMaxX);
            posY = Math.min(Math.max((position.y + 25), posMin), posMaxY);
            pointX = pointXOffset;
            pointY = Math.min(position.y + 10, posMaxY - 15);
            viewModel._down = true;
            viewModel._up = false;
            viewModel._left = false;
            viewModel._right = false;
        }

        return {
            point: {
                x: Math.floor(pointX),
                y: Math.floor(pointY)
            },
            screen: {
                x: Math.floor(posX),
                y: Math.floor(posY)
            }
        };
    }

    /**
     * The view model for {@link Balloon}.
     * @alias BalloonViewModel
     * @constructor

     * @param {Scene} scene The scene instance to use.
     * @param {Element} contentElement The element in which to display balloon content.
     * @param {Element} balloonElement The element containing all elements that make up the balloon.
     * @param {Element} container The element containing the balloon.

     */
    var BalloonViewModel = function(scene, contentElement, balloonElement, container) {
        this._scene = scene;
        this._container = container;
        this._balloonElement = balloonElement;
        this._contentElement = contentElement;
        this._content = contentElement.innerHTML;
        this._computeScreenPosition = undefined;

        this._positionX = '0';
        this._positionY = '0';
        this._pointX = '0';
        this._pointY = '0';
        this._updateContent = false;
        this._timerRunning = false;

        this.showBalloon = false;
        this._down = true;
        this._up = false;
        this._left = false;
        this._right = false;

        this._maxWidth = Math.floor(this._container.clientWidth*0.25) + 'px';
        this._maxHeight = Math.floor(this._container.clientHeight*0.25) + 'px';

        knockout.track(this, ['showBalloon', '_positionX', '_positionY', '_pointX', '_pointY',
                              '_down', '_up', '_left', '_right', '_maxWidth', '_maxHeight']);

        var that = this;

        this._update = function() {
            if (!that._timerRunning) {
                if (that._updateContent) {
                    that.showBalloon = false;
                    that._timerRunning = true;
                    setTimeout(function () {
                        that._contentElement.innerHTML = that._content;
                        if (typeof that._computeScreenPosition === 'function') {
                            var screenPos = that._computeScreenPosition();
                            if (typeof screenPos !== 'undefined') {
                                var pos = shiftPosition(that, screenPos);
                                that._pointX = pos.point.x + 'px';
                                that._pointY = pos.point.y + 'px';

                                that._positionX = pos.screen.x + 'px';
                                that._positionY = pos.screen.y + 'px';
                            }
                        }
                        that.showBalloon = true;
                        that._timerRunning = false;
                    }, 100);
                    that._updateContent = false;
                } else  if (typeof that._computeScreenPosition === 'function') {
                    var screenPos = that._computeScreenPosition();
                    if (typeof screenPos !== 'undefined') {
                        var pos = shiftPosition(that, screenPos);
                        that._pointX = pos.point.x + 'px';
                        that._pointY = pos.point.y + 'px';

                        that._positionX = pos.screen.x + 'px';
                        that._positionY = pos.screen.y + 'px';
                    }
                }
            }
        };
    };

    defineProperties(BalloonViewModel.prototype, {
        /**
         * Updates the view of the balloon
         * @memberof BalloonViewModel.prototype
         *
         * @type {Function}
         */
        update: {
            get: function() {
                return this._update;
            }
        },

        /**
         * Sets the object for which to display the balloon
         * @memberof BalloonViewModel
         *
         * @type {Object}
         */
        pickObject: {
            set: function(value) {
                var scene = this._scene;
                if (typeof value !== 'undefined' && typeof value.balloon === 'string') {
                    if (typeof value.computeScreenSpacePosition === 'function') {
                        this._computeScreenPosition = function() { return value.computeScreenSpacePosition(scene.getContext(), scene.getFrameState()); };
                    } else if (typeof value.getPosition === 'function') {
                        var position = value.getPosition();
                        this._computeScreenPosition = function() { return scene.computeScreenSpacePosition( position, screenPosition); };
                    }
                    this._content = value.balloon;
                    this._updateContent = true;
                    this.showBalloon = true;
                }

            }

        }
    });

    return BalloonViewModel;
});