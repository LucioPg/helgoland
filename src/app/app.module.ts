import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ProfilesModule } from './profiles/profiles.module';
import { TimeseriesModule } from './timeseries/timeseries.module';
import { TrajectoriesModule } from './trajectories/trajectories.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    TimeseriesModule,
    TrajectoriesModule,
    ProfilesModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }