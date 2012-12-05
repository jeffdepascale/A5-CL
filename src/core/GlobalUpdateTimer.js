
a5.Package("a5.cl.core")

	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("GlobalUpdateTimer", 'singleton final', function(self, im){

		var timer,
		clInstance,
		interval,
		evtInstance = a5.Create(im.CLEvent, [im.CLEvent.GLOBAL_UPDATE_TIMER_TICK]);
		
		this.GlobalUpdateTimer = function(_interval){
			self.superclass(this);
			interval = _interval;
			clInstance = self.cl();
			evtInstance.shouldRetain(true);
		}
		
		this.startTimer = function(){
			if(!timer)
				timer = setInterval(update, interval);
		}
		
		this.stopTimer = function(){
			this._cl_killTimer();
		}
		
		var update = function(){
			clInstance.dispatchEvent(evtInstance);
		}
		
		this._cl_killTimer = function(){
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		}		
});