/*globals $, window */

'use strict';

$('document').ready(function () {
  
    var panorama = {
        // properties
        $panorama: $('.panorama'),
        $moveElement: $('.panorama img'),
        timestart: 0,
        seconds: 5,
        msTotal: 0,
        direction: -1,
        positionX: 0,
        animationFrameID: false,
        myRequestAnimationFrame: (function () {
            return function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            };
        })(),
    
        // methods
        step: function (timestart) {

            var self = this,
                timestamp,
                percentage,
                positionX;
    
            timestamp = Date.now();
            self.progress = timestamp - timestart;
            percentage = (self.progress * (100 / self.msTotal));

            positionX = self.direction * percentage;
            positionX += '%';

            self.$moveElement.css('transform', 'translateX(' + positionX + ')');
  
            if (self.progress < self.msTotal) {
                timestamp += 10;

                self.animationFrameID = self.myRequestAnimationFrame(function () {
                    self.step.call(self, timestart);
                });
            }
  
        },
    
        init: function () {
  
            var self = this;

            // set initial values
            this.msTotal = this.seconds * 1000;

            // set listeners
            this.$moveElement.on('touchstart', function () {
                clearTimeout(self.animationFrameID);
            });

            this.$moveElement.on('touchend', function () {
                var playFrom = Date.now();
                playFrom = playFrom - self.progress;
                self.step(playFrom);
            });
        
            this.step(Date.now());
    
        }

    };

    panorama.init();
  
});