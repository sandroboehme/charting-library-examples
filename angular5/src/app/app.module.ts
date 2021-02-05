import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';  // replaces previous Http service


import { AppComponent } from './app.component';
import { AppHeaderComponent } from './app-header/app-header.component';
import { TvChartContainerComponent } from './tv-chart-container/tv-chart-container.component';
import { ServerService } from './tv-chart-container/server.service';


@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    TvChartContainerComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [ServerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
