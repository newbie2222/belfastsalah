import { Component } from '@angular/core';

import {AlertController, ModalController, NavController, ToastController} from 'ionic-angular';
import {FormBuilder, FormGroup} from "@angular/forms";
import {Settings} from "../../providers/settings";
import {PrayerTimes} from "../../providers/prayertimes";
import {Notifications} from "../../providers/notifications";

import {MinuteSelectorModal} from './minute-selector-modal';

import packageJson from '../../../package.json';
import {Analytics} from "../../providers/analytics";

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  tabEnterTime: Date;

  settingsReady = false;

  options: any;

  form: FormGroup;

  hasHanafiAsr: false;


  constructor(
    public navCtrl: NavController,
    public settings: Settings,
    public formBuilder: FormBuilder,
    public prayerTimes: PrayerTimes,
    public toastCtrl : ToastController,
    public notifications : Notifications,
    public modalCtrl: ModalController,
    public alertCtrl : AlertController,
    public analytics: Analytics) {
  }

  showInfo() {
    this.alertCtrl.create({
      title: `Prayer Times ${packageJson.version}`,
      message: `Created by Mohamed Eltuhamy`
    }).present();
  }
  clickLocation(){
    let previousLocation = this.settings.allSettings.location;
    this.settings.setValue('location', '').then(() => {
      this.prayerTimes.getTimeTable({useCache: false, previousLocation}).then(() => this.notifications.schedule()).then(() => {
        this.initialise();
        this.toastCtrl.create({message: 'Location changed', duration: 1600}).present();
      });
    });

  }

  clickNotifyMinutes(){
    const previousNotifyMinutes = this.settings.allSettings.notifyMinutes;
    const modal = this.modalCtrl.create(MinuteSelectorModal, {previousNotifyMinutes});
    const modalDismissed = new Promise(resolve => modal.onDidDismiss((data) => resolve(data)));
    modalDismissed.then(({newNotifyMinutes}) => {
      if(newNotifyMinutes !== previousNotifyMinutes){
        this.settings.setValue('notifyMinutes', newNotifyMinutes);
        this.notifications.schedule().then(() => {
          this.toastCtrl.create({message: 'Notification time changed', duration: 1600}).present();
        });
      }
    });

    modal.present();

  }

  _buildForm(){
    let group: any = {
      notifications: [this.options.notifications],
      hanafiAsr: [this.options.hanafiAsr],
      nightMode: [this.options.nightMode],
      nightModeMaghrib: [this.options.nightModeMaghrib],
    };

    this.form = this.formBuilder.group(group);

    this.form.valueChanges.subscribe((v) => {
      const oldNotificationSetting = this.settings.allSettings.notifications;
      const oldHanafiSetting = this.settings.allSettings.hanafiAsr;
      this.settings.merge(this.form.value).then(() => {
        this.analytics.peopleSet(Object.assign({}, this.settings.allSettings));

        // if notifications changed, we need to re-schedule
        if(oldNotificationSetting !== v.notifications){
          return this.notifications.schedule().then(() => {
            if(v.notifications){
              this.toastCtrl.create({message: 'Notifications enabled', duration: 1600}).present();
            } else {
              this.toastCtrl.create({message: 'Notifications disabled', duration: 1600}).present();
            }
          });
        }

        // If hanafi asr has changed, re-schedule
        if(oldHanafiSetting !== v.hanafiAsr){
          this.notifications.schedule();
        }

      });

    });
  }

  ionViewDidLoad() {
    // Build an empty form for the template to render
    this.form = this.formBuilder.group({});
  }


  ionViewWillEnter() {
    // Build an empty form for the template to render
    this.form = this.formBuilder.group({});
    this.initialise();
    this.tabEnterTime = new Date();
    this.analytics.track('Tab - Enter - Settings');
  }

  ionViewWillLeave(){
    let now = new Date();
    this.analytics.track('Tab - Leave - Month', {tabTimeSeconds: (now.getTime() - this.tabEnterTime.getTime())/1000});
  }

  initialise() {
    this.settings.load().then(() => {
      this.options = this.settings.allSettings;
      this._buildForm();
    }).then(() => this.prayerTimes.getTimeTable())
      .then((prayerTimeTable) => {
        this.hasHanafiAsr = prayerTimeTable.hasHanafiAsr();
      })
      .then(() => this.settingsReady = true);
  }

}


