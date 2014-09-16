/*globals $, window, jQuery */

'use strict';

/***
 * jQuery Dragabble Image Panorama plugin
 *
 * To use do $('#ID').panorama()
 *
 * Original author: @heldrida (Helder C.)
 *
 * For mouse drag add the following plugin: Touch enabled jQuery.event.drag
 * http://www.shamasis.net/projects/jquery-drag-touch/
 * 
 * DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 * Version 2, December 2004
 *
 * Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 * Everyone is permitted to copy and distribute verbatim or modified
 * copies of this license document, and changing it is allowed as long
 * as the name is changed.
 * 
 * DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 * TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 
 * 
 * 0. You just DO WHAT THE FUCK YOU WANT TO.
 *
 */
(function ($) {

    function Panorama($element) {

        // properties
        this.$panorama = null;
        this.$moveElement = null;
        this.swipeMode = null;
        this.timestart = 0;
        this.seconds = 60;
        this.msTotal = 0;
        this.direction = -1;
        this.positionX = 0;
        this.percentage = 0;
        this.animationFrameID = false;

        this.myRequestAnimationFrame =  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            (function () {
                return function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                };
            }());

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }

        this.touchPlayTimeout = 5000;
        this.moveTimeoutID = null;
        this.transitionTimeoutID = null;
        this.dragPositionTimeoutID = null;
        this.rightBoundary = null;
        this.touchSpeed = 25;
        this.touchDistance = {
            start: 0,
            end: 0
        };
        this.callback = [];

        // methods
        this.step = function (timestart) {

            var self = this,
                timestamp,
                positionX;

            timestamp = Date.now();
            self.progress = timestamp - timestart;
            self.percentage = (self.progress * (100 / self.msTotal));

            positionX = self.direction * self.percentage;
            positionX = self.positionBounderies(positionX);
            positionX += '%';

            self.position(positionX);

            if (self.progress < self.msTotal) {
                timestamp += 10;

                self.animationFrameID = self.myRequestAnimationFrame.call(window, function () {
                    self.step.call(self, timestart);
                });
            }

            // stop recursive call if finished
            if (self.percentage >= this.rightBoundary) {

                cancelAnimationFrame.call(window, self.animationFrameID);

                // if a callback is set, call it when step animation finished
                if (typeof self.callback === "object") {
                    $.each(self.callback, function (index, fn) {
                        fn();
                    });
                }

            }

        };

        this.positionBounderies = function (positionX) {

            // move the next line to init method, after image preload done!
            this.rightBoundary = 100 - (100 * (this.$panorama.width() / this.$moveElement.width()));

            positionX = positionX > 0 ? 0 : positionX;
            positionX = (positionX < 0 && Math.abs(positionX) > this.rightBoundary) ? this.direction * this.rightBoundary : positionX;

            return positionX;

        };

        this.progressByPercentage = function (percentage) {

            return percentage * (this.msTotal / 100);

        };

        this.dragIt = function (touchX) {

            var self = this,
                positionX,
                percentage = (this.progress * (100 / this.msTotal));

            positionX = this.direction * percentage;
            positionX = positionX + (touchX / this.touchSpeed);
            positionX = this.positionBounderies(positionX);
            positionX += '%';

            // update percentage
            this.percentage = Math.abs(parseFloat(positionX));

            self.dragPositionTimeoutID = setTimeout(function () {
                self.position(positionX);
            }, 50);
        };

        this.position = function (posX) {

            this.$moveElement.css('transform', 'translateX(' + posX + ')');

        };

        this.reset = function () {

            var self = this;

            self.$moveElement.on('transitionend', function (e) {

                if (e.originalEvent.propertyName === 'opacity') {

                    if (self.$moveElement.css('opacity') === "0") {

                        // reset properties
                        self.percentage = 0;
                        self.progress = 0;
                        self.position(0);

                        self.$moveElement.removeClass('end');

                    } else {

                        // reInitialise the step animation
                        self.step(Date.now());

                    }

                }

            });

            self.$moveElement.addClass('end');

        };

        this.init = function ($element) {

            var self = this;

            // set initial values
            this.$panorama = $element;
            this.$moveElement = $element.find('img');
            this.swipeMode = $element.data('swipe');
            this.msTotal = this.seconds * 1000;

            // set listeners
            this.$moveElement.on('tap touchstart mousedown', function (e) {
                console.log('touchstart or tap', Date.now());

                // on mousedown prevent browser default `img` drag
                e.preventDefault();

                var touch = e.type === "mousedown" ? e : e.originalEvent.touches[0];

                cancelAnimationFrame.call(window, self.animationFrameID);
                cancelAnimationFrame.call(window, self.moveTimeoutID);
                cancelAnimationFrame.call(window, self.transitionTimeoutID);

                Boolean(self.swipeMode) === true ? self.$moveElement.addClass('touch') : null;

                self.touchDistance.start = touch.pageX;

                // ease out (is triggered on touchend)
                self.$moveElement.off('transitionend').on('transitionend', function (e) {
                    if (e.originalEvent.propertyName === 'transform') {
                        self.$moveElement.removeClass('dragTransition');
                    }
                });

            });

            this.$moveElement.on('touchend mouseup', function (e) {

                // on mousedown prevent browser default `img` drag
                e.preventDefault();

                // calculate where to play from using current progress
                var playFrom = null;

                self.progress = self.progressByPercentage(self.percentage);

                // trigger the transition (the drag position x setter, has a small delay)
                // allowing this to work
                self.$moveElement.addClass('dragTransition');

                // play from where the user left `dragging`
                self.moveTimeoutID = setTimeout(function () {

                    cancelAnimationFrame.call(window, self.moveTimeoutID);
                    cancelAnimationFrame.call(window, self.dragPositionTimeoutID);

                    playFrom = Date.now();
                    playFrom = playFrom - self.progress;

                    // ensure transition is not enabled before proceeding
                    // with step animation
                    self.$moveElement.removeClass('dragTransition');

                    self.step(playFrom);

                    Boolean(self.swipeMode) === true ? self.$moveElement.removeClass('touch') : null;

                }, self.touchPlayTimeout);


            });

            this.$moveElement.on('touchmove drag', function (e) {

                var touch = e.type === 'drag' || e.type === 'mousemove' ? e : e.originalEvent.touches[0],
                    distance = 0;

                self.oldX = touch.pageX;
                self.touchDistance.end = touch.pageX;

                distance = self.touchDistance.end - self.touchDistance.start;

                self.dragIt(distance);

            });

            // set animation finish callback
            this.callback.push(this.reset.bind(this));

            this.step(Date.now());

        };

        this.init($element);

    }

    $.fn.panorama = function () {
        return (function ($element) {
            new Panorama($element);
        }(this));
    };

}(jQuery));

$('document').ready(function () {

    $('#foo').panorama();
    $('#bar').panorama();

});