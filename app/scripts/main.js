/*globals $, window */

'use strict';

$('document').ready(function () {

    var panorama = {
        // properties
        $panorama: $('.panorama'),
        $moveElement: $('.panorama img'),
        swipeMode: $('.panorama').data('swipe'),
        timestart: 0,
        seconds: 12,
        msTotal: 0,
        direction: -1,
        positionX: 0,
        percentage: 0,
        animationFrameID: false,
        myRequestAnimationFrame: (function () {
            return function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            };
        }()),
        touchPlayTimeout: 5000,
        moveTimeoutID: null,
        transitionTimeoutID: null,
        dragPositionTimeoutID: null,
        rightBoundary: null,
        touchSpeed: 25,
        touchDistance: {
            start: 0,
            end: 0
        },
        callback: [],

        // methods
        step: function (timestart) {

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

                self.animationFrameID = self.myRequestAnimationFrame(function () {
                    self.step.call(self, timestart);
                });
            }

            // stop recursive call if finished
            if (self.percentage >= this.rightBoundary) {

                clearTimeout(self.animationFrameID);

                // if a callback is set, call it when step animation finished
                if (typeof self.callback === "object") {
                    $.each(self.callback, function (index, fn) {
                        console.log('fn', fn);
                        fn();
                    });
                }

            }

        },

        positionBounderies: function (positionX) {

            // move the next line to init method, after image preload done!
            this.rightBoundary = 100 - (100 * (this.$panorama.width() / this.$moveElement.width()));

            positionX = positionX > 0 ? 0 : positionX;
            positionX = (positionX < 0 && Math.abs(positionX) > this.rightBoundary) ? this.direction * this.rightBoundary : positionX;

            return positionX;

        },

        progressByPercentage: function (percentage) {

            return percentage * (this.msTotal / 100);

        },

        dragIt: function (touchX) {

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
        },

        position: function (posX) {

            this.$moveElement.css('transform', 'translateX(' + posX + ')');

        },

        reset: function () {

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

        },

        init: function () {

            var self = this;

            // set initial values
            this.msTotal = this.seconds * 1000;

            // set listeners
            this.$moveElement.on('touchstart mousedown', function (e) {

                // on mousedown prevent browser default `img` drag
                e.preventDefault();

                var touch = e.type === "mousedown" ? e : e.originalEvent.touches[0];

                clearTimeout(self.animationFrameID);
                clearTimeout(self.moveTimeoutID);
                clearTimeout(self.transitionTimeoutID);

                Boolean(self.swipeMode) === true ? self.$moveElement.addClass('touch') : null;

                self.touchDistance.start = touch.pageX;

                // ease out (is triggered on touchend)
                self.$moveElement.off('transitionend').on('transitionend', function(e){
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

                    clearTimeout(self.moveTimeoutID);

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

        }

    };

    panorama.init();

});