import {ChangeDetectorRef, Component} from '@angular/core';
import {SplashScreen} from '@ionic-native/splash-screen';
import {NavController} from 'ionic-angular';
import {PrayerTimeDay, PrayerTimes, PrayerTimeTime, PrayerTimesTable} from "../../providers/prayertimes";
import addDays from 'date-fns/add_days';
import {Subscription} from "rxjs";
import {TimerObservable} from "rxjs/observable/TimerObservable";

@Component({
  selector: 'page-today',
  templateUrl: 'today.html'
})
export class TodayPage {
  prayerTimesNow: PrayerTimeDay;
  prayerTimesTomorrow: PrayerTimeDay;
  nextPrayer: PrayerTimeTime;
  prevPrayer: PrayerTimeTime;
  currentDate: Date;
  prayerTimesTable: PrayerTimesTable;
  private tickSub : Subscription;

  constructor(public navCtrl: NavController, public prayerTimesService : PrayerTimes, public splashScreen : SplashScreen, private cd : ChangeDetectorRef) {
  }

  loadTimeTable(){
    return this.prayerTimesService.getTimeTable().then(prayerTime => {
      this.prayerTimesTable = prayerTime;
      this.update(new Date());
    });
  }

  update(date : Date){
    if(this.prayerTimesTable){
      this.prayerTimesNow = this.prayerTimesTable.getByDate(date);
      this.prayerTimesTomorrow = this.prayerTimesTable.getByDate(addDays(date, 1));
      let times = this.prayerTimesTable.getNextAndPrevPrayer(date);
      this.nextPrayer = times.next;
      this.prevPrayer = times.prev;
      this.currentDate = date;
      this.cd.detectChanges();
    }
  }

  ionViewWillEnter() {
    this.loadTimeTable().then(() => {
      let timer = TimerObservable.create(0, 1000);

      this.tickSub = timer.subscribe(t => {
        this.update(new Date());
      });

      this.splashScreen.hide();
    });
  }

  ionViewWillLeave(){
    if(this.tickSub) {
      this.tickSub.unsubscribe();
    }
  }


}

