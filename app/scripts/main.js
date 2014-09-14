/*globals $, window */

'use strict';

$('document').ready(function () {
  
    var panorama = {
        // properties
        $panorama: $('.panorama'),
        $moveElement: $('.panorama img'),
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
        })(),
        touchPlayTimeout: 3000,
        moveTimeoutID: null,
        rightBoundary: null,
        touchSpeed: 25,
        touchDistance: {
            start: 0,
            end: 0
        },
    
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

            var positionX,
                percentage = (this.progress * (100 / this.msTotal));

            positionX = this.direction * percentage;
            positionX = positionX + (touchX / this.touchSpeed);
            positionX = this.positionBounderies(positionX);
            positionX += '%';

            // update percentage
            this.percentage = Math.abs(parseFloat(positionX));

            this.position(positionX);
        },

        position: function (posX) {
            
            this.$moveElement.css('transform', 'translateX(' + posX + ')');

        },
    
        init: function () {
  
            var self = this;

            // set initial values
            this.msTotal = this.seconds * 1000;

            // set listeners
            this.$moveElement.on('touchstart mousedown', function (e) {
                
                // on mousedown prevent browser default `img` drag
                e.preventDefault();

                var touch = e.originalEvent.touches[0];

                clearTimeout(self.animationFrameID);
                clearTimeout(self.moveTimeoutID);

                //self.$moveElement.addClass('touch');

                self.touchDistance.start = touch.pageX;
            
            });

            this.$moveElement.on('touchend mouseup', function (e) {
                
                // on mousedown prevent browser default `img` drag
                e.preventDefault();

                // calculate where to play from using current progress
                var playFrom = null;

                self.progress = self.progressByPercentage(self.percentage);

                self.moveTimeoutID = setTimeout(function () {

                    clearTimeout(self.moveTimeoutID);
 
                    playFrom = Date.now();
                    playFrom = playFrom - self.progress;

                    self.step(playFrom);
                
                    //self.$moveElement.removeClass('touch');

                }, self.touchPlayTimeout);

            });

            this.$moveElement.on('touchmove', function (e) {

                var touch = e.originalEvent.touches[0],
                    distance = 0;

                /*
                if (touch.pageX < self.oldX) {

                    self.direction = -1;

                } else if (touch.pageX > self.oldX) {

                    self.direction = 1;

                }
                */

                self.oldX = touch.pageX;
                self.touchDistance.end = touch.pageX;

                distance = self.touchDistance.end - self.touchDistance.start;

                self.dragIt(distance);

            });

            this.step(Date.now());
    
        }

    };

    panorama.init();
  
});