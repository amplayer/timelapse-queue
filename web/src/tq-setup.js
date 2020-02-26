import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-spinner/paper-spinner.js';
import './shared-styles.js';
import Cropper from 'cropperjs';

class Setup extends PolymerElement {
  static get template() {
    return html`
      <link rel="stylesheet" href="../node_modules/cropperjs/dist/cropper.css">
      <style include="shared-styles">
        :host {
          display: block;

          padding: 10px;
        }
        .constrain-width {
          max-width: 800px;
        }
        .short-input {
          max-width: 200px;
        }
        .medium-input {
          max-width: 300px;
        }
        .slider paper-slider {
          --paper-slider-input: {
             width: 650px;
          }
          width: 650px;
        }
        .slider {
          display: flex;
          align-items: center;
        }
        .slider > span {
          width: 85px;

        }
        .helptext {
          color: gray;
          font-size: small;
        }
        .startbutton {
          padding-top: 20px;
        }
        .error {
          color: red;
          padding-bottom: 15px;
        }
        .stack-options {
          padding-left: 20px;
        }
        .stack-option {
          padding-top: 20px;
        }
        .infobox {
          padding: 3px;
          background-color: #f4f4f4;
          display: inline-block;
        }
        #container img {
          max-width: 100%;
        }
        .cropcontainer {
          max-width: 900px;
        }
        .below-crop {
          display: flex;
          justify-content: space-between;
          max-width: 900px;
        }
        .skip-input paper-input {
          width: 100px;
        }
        .inputrow {
          display: flex;
          align-items: center;
          margin-top: -8px;
        }
        .inputrow > paper-input {
          width: 60px;
          padding-right: 5px;
        }
        .inputrow > span {
          padding: 10px;
        }
      </style>

      <iron-ajax
          id="convertajax"
          url="/convert"
          method="POST"
          handle-as="text"
          on-response="onConvertSuccess_"
          on-error="onConvertError_"
          ></iron-ajax>
      <iron-ajax
          id="timelapseajax"
          url="/timelapse"
          handle-as="json"
          on-response="onTimelapseAjax_"
          ></iron-ajax>
      <iron-ajax
          id="profilesajax"
          url="/profiles"
          handle-as="json"
          on-response="onProfiles_"
          auto
          ></iron-ajax>

      <div class="card">
        <div class="circle">2</div>
        <h1>Configure Timelapse Job</h1>
        <p>
          <div>Input Timelapse</div>
          <div class="helptext infobox">
             <div>[[path]]</div>
             <div>[[timelapse.Count]] frames</div>
             <div>[[timelapse.DurationString]] (at 60fps)</div>
          </div>
        </p>

        <p class="medium-input">
          <paper-input
                  id="output-filename"
                  label="Output Filename"
                  value="{{filename_}}"
                  always-float-label
                  auto-validate
                  pattern="[a-zA-Z0-9-_ ]+"
                  error-message="Not a valid filename"
                  autofocus
                  >
            <span slot="suffix">.mp4</span>
          </paper-input>
        </p>

        <p>
          <div class="helptext">
           <div>Select the resolution of the output file.</div>
           <div>Larger resolutions can be useful for panning and scaling effects.</div>
          </div>
          <paper-dropdown-menu label="Output Resolution" no-animations>
            <paper-listbox attr-for-selected="value" selected="{{profile_}}" slot="dropdown-content">
              <template is="dom-repeat" items="[[profiles_]]">
                <paper-item value="[[item]]">[[item.Name]]</paper-item>
              </template>
            </paper-listbox>
          </paper-dropdown-menu>
        </p>

        <p>
          <div class="helptext">
           <div>The output MP4 framerate can be adjusted.</div>
           <div>60fps produces smooth video.</div>
           <div>30fps can be used to extend the length of the timelapse.</div>
          </div>
          <paper-dropdown-menu label="Output Framerate" no-animations>
            <paper-listbox attr-for-selected="value" selected="{{fps_}}" slot="dropdown-content">
              <paper-item value="30">30 fps</paper-item>
              <paper-item value="60">60 fps</paper-item>
            </paper-listbox>
          </paper-dropdown-menu>
        </p>


        <p>
          <div>Output Video File</div>
          <div class="helptext infobox">
            <div>MP4 [[profile_.Width]]x[[profile_.Height]] [[fps_]] fps</div>
            <div hidden$="[[!filename_]]">[[timelapse.OutputPath]][[filename_]].mp4</div>
          </div>
        </p>

        <p>
        <div class="helptext">
          Adjust the start and end frame positions to control the length of the timelapse.
        </div>
        <div class="slider">
          <span>Start Frame</span>
         <paper-slider min="0" max="[[getLastFrame_(timelapse)]]" value="{{startFrame_}}" pin></paper-slider>
          <paper-input
                type="number"
                min="0"
                max="[[getLastFrame_(timelapse)]]"
                value="{{startFrame_}}"
                no-label-float
            ></paper-input>
        </div>
        <div class="slider">
          <span>End Frame</span>
          <paper-slider min="0" max="[[getLastFrame_(timelapse)]]" value="{{endFrame_}}" pin></paper-slider>
          <paper-input
                type="number"
                min="0"
                max="[[getLastFrame_(timelapse)]]"
                value="{{endFrame_}}"
                no-label-float
            ></paper-input>
        </div>
        </p>

        <p>
          <div>
              <paper-checkbox checked="{{skipEnabled_}}">
                Speed Up with Frame Skip
              </paper-checkbox>
          </div>
          <div>
            <iron-collapse opened="[[skipEnabled_]]">
              <div class="helptext">
                <div>Set the skip count to speed up the timelapse.</div>
                <div>For example, a skip count of "2" will make the timelapse twice as fast.</div>
              </div>
              <div class="skip-input">
                <paper-input
                      label="Skip Count"
                      type="number"
                      min="2"
                      max="[[getLastFrame_(timelapse)]]"
                      value="{{skip_}}"
                  ></paper-input>
              </div>
            </iron-collapse>
          </div>
        </p>

        <p>
          <div>Select Image Region</div>
          <div hidden$="[[!loading_]]">
              <paper-spinner active="[[loading_]]"></paper-spinner>
          </div>
          <div class="cropcontainer" id="container">
          </div>
          <div class="below-crop">
                  <div class="helptext inputrow">
                      <paper-input
                            type="number"
                            min="0"
                            value="[[crop.x]]"
                            data-param="x"
                            on-value-changed="onUpdateParam_"
                            label="X="
                        ></paper-input>
                      <paper-input
                            type="number"
                            min="0"
                            value="[[crop.y]]"
                            data-param="y"
                            on-value-changed="onUpdateParam_"
                            label="Y="
                        ></paper-input>
                      <span></span>
                      <paper-input
                            type="number"
                            min="0"
                            value="[[crop.width]]"
                            data-param="width"
                            on-value-changed="onUpdateParam_"
                            label="Width"
                        ></paper-input>
                      <paper-input
                            type="number"
                            min="0"
                            value="[[crop.height]]"
                            data-param="height"
                            on-value-changed="onUpdateParam_"
                            label="Height"
                        ></paper-input>
                  </div>
                  <div>
                    <paper-button on-tap="onSetSize_">
                           <iron-icon icon="settings-overscan"></iron-icon>
                          Set Region to [[profile_.Width]] x [[profile_.Height]]
                    </paper-button>
                  </div>
          </div>
        </p>

        <p>
          <div>
                  <paper-checkbox checked="{{stack_}}">
                    Photo Stacking
                  </paper-checkbox>
          </div>
          <div>
                  <iron-collapse opened="[[stack_]]">
                  <div class="stack-options">
                        <div class="stack-option">
                          <div class="helptext">
                            <div>The frame stack count controls how long the stacking tail is.</div>
                            <div>At 60fps, a value of "60" will give one second of history.</div>
                            <div>Larger values will give a longer tail, though will take longer to process.</div>
                          </div>
                          <paper-input
                                class="short-input"
                                label="Frames to Stack"
                                type="number"
                                min="1"
                                max="[[timelapse.Count]]"
                                value="{{stackWindow_}}"
                                disabled="[[stackAll_]]"
                                always-float-label></paper-input>
                          <paper-checkbox checked="{{stackAll_}}">
                            Stack All
                          </paper-checkbox>
                       </div>
                       <div class="stack-option">
                          <div class="helptext">
                            <div>Frame skipping can be used to make the stacking effect more obvious.</div>
                            <div>Increase to create larger gaps between stacked images.</div>
                          </div>
                          <paper-checkbox checked="{{stackSkip_}}" disabled="[[stackAll_]]">
                            Stack Frame Skip
                          </paper-checkbox>
                          <paper-input
                                class="short-input"
                                label="Frame Skip"
                                type="number"
                                min="1"
                                max="[[min_(stackWindow_, timelapse.Count)]]"
                                value="{{stackSkipCount_}}"
                                disabled="[[!stackSkip_]]"
                                always-float-label></paper-input>
                       </div>
                       <div class="stack-option">
                          <div class="helptext">
                            <div>The blending mode can be changed to achieve different stacking effects.</div>
                          </div>
                          <!-- animations broken in polymer 3.0, disabled for now -->
                          <paper-dropdown-menu label="Blending Mode" no-animations>
                            <paper-listbox attr-for-selected="value" selected="{{stackMode_}}" slot="dropdown-content">
                              <paper-item value="lighten">Lighten</paper-item>
                              <paper-item value="darken">Darken</paper-item>
                            </paper-listbox>
                          </paper-dropdown-menu>
                       </div>
                  </div>
                  </iron-collapse>
          </div>
        </p>

        <p>
          <div>Advanced Options</div>
          <div class="helptext">
            These options may be useful for debugging performance issues.
          </div>
          <div>
                  <paper-checkbox id="profilecpu">
                    CPU Profiling
                  </paper-checkbox>
          </div>
          <div>
                  <paper-checkbox id="profilemem">
                    Memory Profiling
                  </paper-checkbox>
          </div>
        </p>

        <div class="startbutton">
            <div class="error" hidden$="[[!error_]]">
              <iron-icon icon="error"></iron-icon>
              [[error_]]
            </div>
            <paper-button id="add-button" on-tap="onConvert_" raised>
                   <iron-icon icon="schedule"></iron-icon>
                  Add Timelapse Job to Queue
            </paper-button>
        </div>
      </div>
    `;
  }

  onTimelapseAjax_(e) {
    const resp = e.detail.xhr.response;
    if (!resp) {
            return;
    }
    this.timelapse = resp;
  }

  onFrame_(frame) {
      if (!this.cropper || !this.enableObservers_ || !this.path || !frame) {
          return;
      }
      const url = '/image?path=' + this.path + '&index=' + frame;
      this.cropper.replace(url, true);
  }

  onSetSize_(e) {
    if (!this.cropper) {
            return;
    }
    this.cropper.setData({
      "width": this.profile_.Width,
      "height": this.profile_.Height,
    });
  }
 
  or_(a, b) {
          return a || b;
  }

  min_(a, b) {
    if (!a || !b) {
      return 0;
    }
    return a < b ? a : b;
  }

  getLastFrame_(tl) {
          if (!tl) {
                  return 0;
          }
          return tl.Count - 1;
  }

  onTimelapse_(tl) {
    this.startFrame_ = 0;
    this.endFrame_ = this.getLastFrame_(tl);
  }

  onPath_(path) {
      this.initCropboxIfReady_();
  }     
  
  onConvert_(e) {
    this.$.convertajax.headers={'content-type': 'application/x-www-form-urlencoded'};
    const config = {
      'Path': this.path,
      'X': this.crop.x,
      'Y': this.crop.y,
      'Width': this.crop.width,
      'Height': this.crop.height,
      'OutputName': this.filename_,
      'FrameRate': parseInt(this.fps_, 10),
      'StartFrame': this.startFrame_,
      'EndFrame': this.endFrame_,
      'Skip': this.skipEnabled_ ? parseInt(this.skip_, 10) : 0,
      'Stack': this.stack_,
      'StackWindow': this.stackAll_ ? 0 : parseInt(this.stackWindow_, 10),
      'StackSkipCount': this.stackSkip_ ? parseInt(this.stackSkipCount_, 10) : 0,
      'StackMode': this.stackMode_,
      'OutputProfileName': this.profile_.Name,
    };
    if (this.$.profilecpu.checked) {
      config['ProfileCPU'] = true;
    }
    if (this.$.profilemem.checked) {
      config['ProfileMem'] = true;
    }

    this.$.convertajax.body = {
        'request': JSON.stringify(config),
    };
    this.$.convertajax.generateRequest();
  }

  onConvertSuccess_(e) {
    // Redirect to queue to see the new job.
    window.history.pushState({}, null, '/#/queue');
    window.dispatchEvent(new CustomEvent('location-changed'));

    this.toast_("Job successfully queued.");
    this.error_ = "";
    this.filename_ = "";
    this.startFrame_ = 0;
    this.endFrame_ = 0;
    this.skipEnabled_ = false;
    this.stack_ = false;
    this.stackSkip_ = false;
    this.cropper.destroy();
  }

  onConvertError_(e) {
    this.toast_("Job creation failed."); 
    this.error_ = e.detail.request.xhr.response;
  }

  toast_(msg) {
    this.dispatchEvent(new CustomEvent('toast', {detail: msg, bubbles: true, composed: true}));
  }

  onProfiles_(e) {
    if (!e || !e.detail || !e.detail.xhr || !e.detail.xhr.response) {
      return;
    }
    this.profiles_ = e.detail.xhr.response;
    this.profile_ = this.profiles_[0];

    this.initCropboxIfReady_();
  }

  onProfileChanged_(profile) {
    if (!this.cropper) {
            return;
    }
    this.cropper.setAspectRatio(profile.Width / profile.Height);
  }

  initCropboxIfReady_() {
    if (!this.profile_ || !this.path) {
            return;
    }

    this.$.timelapseajax.params = {'path': this.path};
    this.$.timelapseajax.generateRequest();

    this.loading_ = true;

    const container = this.$.container;
    // Remove any existing elements left behind by the cropping library.
    while (container.firstChild) {
            container.removeChild(container.firstChild);
    }

    // Add new image.
    const img = document.createElement('img');
    img.classList.add("constrain-width");
    img.src = '/image?path=' + this.path;
    container.appendChild(img);

    // TODO set these based on job configuration.
    const width = this.profile_.Width;
    const height = this.profile_.Height;

    this.cropper = new Cropper(img, {
          aspectRatio: width / height,
          crop: (e) => {
            this.crop = this.cropper.getData(true);
          },
          viewMode: 2,
          zoomable: false,
          autoCropArea: 1,
          autoCrop: true,
          ready: (e) => {
            this.loading_ = false;
            this.enableObservers_ = true;
          },
    });
  }

  onUpdateParam_(e) {
      if (!e || !e.detail) {
        return;
      }
      const value = parseInt(e.detail.value, 10);
      if (isNaN(value)) {
        return;
      }
      const param = e.path[0].dataset.param;
      const data = this.cropper.getData();
      data[param] = value;
      this.cropper.setData(data);
  }

  static get properties() {
    return {
      path: {
        type: String,
        observer: 'onPath_',
        value: '',
      },
      timelapse: {
        type: Object,
        observer: 'onTimelapse_',
      },
      crop: {
        type: Object,
      },
      loading_: {
        type: Boolean,
        value: false,
      },
      stack_: {
        type: Boolean,
        value: false,
      },
      stackMode_: {
        type: String,
        value: "lighten",
      },
      fps_: {
        type: String,
        value: "60",
      },
      skip_: {
        type: Number,
        value: 2,
      },
      skipEnabled_: {
        type: Boolean,
        value: false,
      },
      stackAll_: {
        type: Boolean,
        value: false,
      },
      stackSkipCount_: {
        type: Number,
        value: 3,
      },
      stackSkip_: {
        type: Boolean,
        value: false,
      },
      filename_: {
        type: String,
      },
      startFrame_: {
        type: Number,
        observer: 'onFrame_',
      },
      endFrame_: {
        type: Number,
        observer: 'onFrame_',
      },
      stackWindow_: {
        type: Number,
        value: 60,
      },
      enableObservers_: {
        type: Boolean,
        observer: false,
      },
      error_: {
        type: String,
        value: "",
      },
      profiles_: {
        type: Array,
      },
      profile_: {
        type: Object,
        observer: 'onProfileChanged_',
      },
    };
  }
}

window.customElements.define('tq-setup', Setup);
