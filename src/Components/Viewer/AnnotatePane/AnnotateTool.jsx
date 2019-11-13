import React, { Component } from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import {
  Button,
  IconButton,
  CircularProgress
} from '@material-ui/core';
import CircleIcon from '@material-ui/icons/FiberManualRecord';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, 
  faSearchPlus, 
  faSearchMinus, 
  faPlus, 
  faMinus,  
  faEraser, 
  faDrawPolygon,
  faSave,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons'

import ApiManager from '../../../ApiManager';
import ViewerUtility from '../ViewerUtility';

const STROKE_MIN = 1; // Min, max and step size for stroke size
const STROKE_MAX = 60;
const STROKE_STEP = 1;

const ZOOM_MIN = 1.0; //Min transform level for zooming
const ZOOM_MAX = 5.0; //Max transform level for zooming
const ZOOM_STEP = 0.1; //Step size for zooming in and out

const IGNORE_CLASSES = [
  'no class',
  'outside_area'
];

const ERASER_CLASS = {
  name: 'eraser',
  color: '#ffffff',
  number: 0
};

const MASK_CLASS = {
  name: 'mask',
  color: '#ffffffff',
  number: -1,
  colorRgb: {r: 255, g: 255, b: 255, a: 255}
};

const IMAGE_SIZE = 256;

class AnnotateTool extends Component {
  pressedMouseButton = null;
  mouseOnCanvas = false;

  LEEWAY = 5;
  
	prevMousePos = { offsetX: 0, offsetY: 0 };
  
  polygonCoords = [];

	constructor(props) {
    super(props);
    
		this.state = {
      init: false,
      classes: null, 
      
      strokeSize: 5,
      zoom: 2.0,
      hideLabel: false
    };

    this.canvas0 = React.createRef();
    this.canvasTemp = React.createRef();
    this.canvas1 = React.createRef();
	}
  
  componentDidMount = () => {
		this.fetchClasses();
    this.getNewImage();
  }
  
  getNewImage = () => {
    let tileId = this.props.tileId;
    let urlRgb = `/tileService/${this.props.map.id}/${this.props.timestamp}/rgb/${tileId.zoom}/${tileId.tileX}/${tileId.tileY}`;
    let urlLabel = `/tileService/${this.props.map.id}/${this.props.timestamp}/label/${tileId.zoom}/${tileId.tileX}/${tileId.tileY}`;

    if (this.props.user) {
      let tokenString = `?token=${this.props.user.token}`;
      urlRgb += tokenString;
      urlLabel += tokenString;
    }

    let labelImagePromise = ApiManager.get(urlLabel)
      .catch(err => {
        if (err.status === 404 || err.status === 400) {
          return null;
        }
        else {
          throw err;
        }
      });

    Promise.all([ApiManager.get(urlRgb), labelImagePromise])
      .then(imageData => {
        let reader = new FileReader();
        let reader2 = new FileReader();
        let hasLabelImage = imageData[1] !== null;

        let cb = () => {
          let rgbImage = new Image();
          let labelImage = new Image();

          rgbImage.src = reader.result;          
          if (hasLabelImage) {
            labelImage.src = reader2.result;
          }          

          let canvas0 = this.canvas0.current;
          let canvasTemp = this.canvasTemp.current;
          let canvas1 = this.canvas1.current;

          canvas0.width = IMAGE_SIZE;
          canvas0.height = IMAGE_SIZE;
          rgbImage.onload = () => {
            canvas0.getContext('2d').drawImage(rgbImage, 0, 0, canvas0.width, canvas0.height);
          };

          canvas1.width = IMAGE_SIZE;
          canvas1.height = IMAGE_SIZE;
          if (hasLabelImage) {
            labelImage.onload = () => {
              let ctx = canvas1.getContext('2d');
              ctx.drawImage(labelImage, 0, 0, canvas1.width, canvas1.height);
              let imgData = ctx.getImageData(0, 0, canvas1.width, canvas1.height);
              let data = imgData.data;
              for (let i = 0; i < data.length; i+=4) {
                if (data[i] || data[i+1] || data[i+2]) {
                  data[i+3] = 255;
                }
              }
              ctx.putImageData(imgData, 0, 0);
            };
          }          

          canvasTemp.width = IMAGE_SIZE;
          canvasTemp.height = IMAGE_SIZE;
          this.canvasTemp = canvasTemp.getContext('2d');

          this.canvasMain = canvas1.getContext('2d');
          this.canvasMain.imageSmoothingEnabled = false;

          // Sets initial drawing tool settings
          this.canvasMain.lineJoin = 'miter';
          this.canvasMain.lineCap = 'butt';

          this.zoom(0);

          this.setState({ init: true });
        }

        reader.readAsDataURL(imageData[0]);
        if (hasLabelImage) {
          reader2.readAsDataURL(imageData[1]);
        }

        reader.onloadend = () => {
          if (hasLabelImage) {
            reader2.onloadend = cb;
          }
          else {
            cb();
          }          
        };      
      })
      .catch(err => {
        if (err.status === 400 || err.status === 404) {
          alert('No image to label on this tile.');
          this.props.onClose();
        }
        else {
          alert('An error occurred while getting image.');
        }
      });
  }
	
	fetchClasses = () => {
    let mapClasses = this.props.map.classes;

    let classesInfo = [];
    for (let i = 0; i < mapClasses.length; i++) {
      let timestampClasses = mapClasses[i];

      for (let y = 0; y < timestampClasses.classes.length; y++) {
        let _class = timestampClasses.classes[y];

        if (_class.name === ViewerUtility.specialClassName.mask) {
          continue;
        }

        let existingClass = classesInfo.find(x => x.name === _class.name);

        if (!existingClass) {
          existingClass = {
            ..._class
          };

          existingClass.color = `#${_class.color.substring(0, 6)}`; 
          existingClass.colorRgb = hexToRgb(existingClass.color);
          existingClass.colorInt = getUnsignedRgba(existingClass.colorRgb);

          classesInfo.push(existingClass);
        }
      }

      classesInfo.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        }
        else if (a.name < b.name) {
          return -1;
        }
        else {
          return 0;
        }
      });
    }

    classesInfo.push(MASK_CLASS);
    
    this.setState({ classes: classesInfo, drawingClass: classesInfo[0], tool: 'labeler' });
  }
  
  zoom = (direction) => {
    let newZoomFactor = this.state.zoom + (ZOOM_STEP * direction);

    if (newZoomFactor > ZOOM_MAX) {
      newZoomFactor = ZOOM_MAX;
    }
    else if (newZoomFactor < ZOOM_MIN) {
      newZoomFactor = ZOOM_MIN
    }

    let canvases = document.getElementsByClassName('layers');

    for (let i = 0; i < canvases.length; i++) {
      canvases[i].style.transform = 'scale(' + newZoomFactor + ')';
    }

    this.setState({ zoom: newZoomFactor });
  }

  paint = (prevPos, currPos, strokeSize) => {
    if (!this.mouseOnCanvas) {
      return;
    }

    let currentTool = this.state.tool;

    let offsetX = currPos.offsetX;
    let offsetY = currPos.offsetY;

    let x = prevPos.offsetX;
    let y = prevPos.offsetY;

    let radius = Math.ceil(strokeSize / 2);
		
		// Interpolation of points to be drawn in between currPos and prevPos to obtain a line
		let diffX = offsetX - x;
		let diffY = offsetY - y;
    let maxDiff = Math.ceil(Math.max(Math.abs(diffX), Math.abs(diffY))) + 1;    

    if (currentTool === 'eraser') {
      this.canvasMain.globalCompositeOperation = 'destination-out';
      this.canvasMain.fillStyle = ERASER_CLASS.color;

      let i = 0;

      while (i < maxDiff) {
        let centerX = x + Math.round(i * (diffX / maxDiff));
        let centerY = y + Math.round(i * (diffY / maxDiff));

        aliasedCircle(this.canvasMain, centerX, centerY, radius);
        this.canvasMain.fill();
        i++;
      } 
    }    
    else {      
      let i = 0;

      while (i < maxDiff) {
        let centerX = x + Math.round(i * (diffX / maxDiff));
        let centerY = y + Math.round(i * (diffY / maxDiff));
  
        aliasedCircle(this.canvasMain, centerX, centerY, radius);

        this.canvasMain.globalCompositeOperation = 'destination-out';
        this.canvasMain.fillStyle = ERASER_CLASS.color;
        this.canvasMain.fill();
        this.canvasMain.globalCompositeOperation = 'source-over';
        this.canvasMain.fillStyle = this.state.drawingClass.color;
        this.canvasMain.fill();

        i++;
      }
    }
  }
  
  drawCursor = (currPos) => {
    let currentTool = this.state.tool;

    this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

    if (!this.mouseOnCanvas) {
      return;
    }

    let offsetX = currPos.offsetX;
    let offsetY = currPos.offsetY;
    let radius = Math.ceil(this.state.strokeSize / 2);

    this.canvasTemp.globalCompositeOperation = 'source-over';
    if (currentTool === 'labeler') {
      let drawingClass = this.state.drawingClass;
      this.canvasTemp.fillStyle = drawingClass.color;
    }
    else if (currentTool === 'eraser') {
      this.canvasTemp.fillStyle = ERASER_CLASS.color;
    }

    aliasedCircle(this.canvasTemp, offsetX, offsetY, radius);
    this.canvasTemp.fill();
  }
  
	drawPolygon = () => {
		this.canvasTemp.globalCompositeOperation = 'source-over';
		this.canvasTemp.strokeStyle = this.state.drawingClass.color;
    this.canvasTemp.fillStyle = this.state.drawingClass.color;
    this.canvasTemp.lineWidth = 3;
    
    let coordsLen = this.polygonCoords.length;
    
		// If it's the first point, begin path
		if (coordsLen === 1) {
      let firstPointX = this.polygonCoords[0].offsetX;
      let firstPointY = this.polygonCoords[0].offsetY;

      this.canvasTemp.beginPath();
			this.canvasTemp.moveTo(firstPointX, firstPointY);      
      this.canvasTemp.arc(
        firstPointX, 
        firstPointY, 
        this.LEEWAY,
        0, 
        2 * Math.PI
      );
      this.canvasTemp.fill();
      this.canvasTemp.moveTo(firstPointX, firstPointY);
      this.canvasTemp.closePath();
    } 
    else {
      // If the starting point is clicked again, with some leeway, fill the polygon
      let firstPointX = this.polygonCoords[0].offsetX;
      let firstPointY = this.polygonCoords[0].offsetY;

      let lastPointX = this.polygonCoords[coordsLen-1].offsetX;
      let lastPointY = this.polygonCoords[coordsLen-1].offsetY;

			if ((firstPointX - this.LEEWAY <= lastPointX && firstPointX + this.LEEWAY >= lastPointX)
				&& (firstPointY - this.LEEWAY <= lastPointY && firstPointY + this.LEEWAY >= lastPointY)) {
				this.polygonCoords.pop(); // Remove last coordinate as it should connect to start point
				this.fillPolygon();
      } 
      else {
        this.canvasTemp.beginPath();
			  this.canvasTemp.moveTo(this.polygonCoords[coordsLen-2].offsetX,this.polygonCoords[coordsLen-2].offsetY);      
				// Additional points are connected with a line to the previous point
				this.canvasTemp.lineTo(lastPointX, lastPointY);
        this.canvasTemp.stroke();
        this.canvasTemp.closePath();        
			}
		}
	}
	
	fillPolygon = () => {
		if (this.polygonCoords.length === 0) {
			return;
    }
    
		// Construct and fill the polygon
		this.canvasMain.beginPath();
		this.canvasMain.moveTo(this.polygonCoords[0].offsetX, this.polygonCoords[0].offsetY);
		for (let i = 1; i < this.polygonCoords.length; i++) {
			this.canvasMain.lineTo(this.polygonCoords[i].offsetX,this.polygonCoords[i].offsetY);
		}
    this.canvasMain.closePath();
    
    this.canvasMain.globalCompositeOperation = 'destination-out';
    this.canvasMain.fillStyle = ERASER_CLASS.color;
    this.canvasMain.fill();
    this.canvasMain.globalCompositeOperation = 'source-over';
    this.canvasMain.fillStyle = this.state.drawingClass.color;
    this.canvasMain.fill();
    
		let coordsLen = this.polygonCoords.length;
		for (let i = 1; i < coordsLen; i++) {
			this.paint(this.polygonCoords[i-1], this.polygonCoords[i], 3);
		}
    this.paint(this.polygonCoords[coordsLen-1], this.polygonCoords[0], 3);
    
		// Reset polygon
		this.erasePolygon();
	}
	
	erasePolygon = () => {
		this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
		this.polygonCoords = [];
  }

  changeToolSize = (steps, cb) => {
    let newStrokeSize = this.state.strokeSize + STROKE_STEP * steps;

    if (newStrokeSize < STROKE_MIN) {
      newStrokeSize = STROKE_MIN;
    }
    else if (newStrokeSize > STROKE_MAX) {
      newStrokeSize = STROKE_MAX;
    }
    
    this.setState({ strokeSize: newStrokeSize }, cb);
  }

	saveCanvas = () => {
    if (this.saving) {
      return;
    }

    this.saving = true;

    const labelImage = this.canvasMain.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    
		const labelBuffer32 = new Uint32Array(labelImage.data.buffer);
		const dataArray = [];
		for (let y = 0; y < IMAGE_SIZE; y++) {
			dataArray.push(new Array(IMAGE_SIZE).fill(0));
    }

    let classesInfo = this.state.classes.filter(x => !IGNORE_CLASSES.includes(x.name));
    
    let count = 0;
    
    for (let y = 0; y < IMAGE_SIZE; y++) {
      for (let x = 0; x < IMAGE_SIZE; x++) {
        let labelColorInt = labelBuffer32[count];

        let labelNumber = null;
        let rgbaColor = getRgbaColor(labelColorInt);

        if (labelColorInt !== 0) {
          let matchingClass = classesInfo.find(z => {
            let diffR = Math.abs(z.colorRgb.r - rgbaColor.r);
            let diffG = Math.abs(z.colorRgb.g - rgbaColor.g);
            let diffB = Math.abs(z.colorRgb.b - rgbaColor.b);

            if (diffR < 3 && diffG < 3 && diffB < 3) {
              return true;
            }
          });
          if (matchingClass) {
            labelNumber = matchingClass.number;
          }
        }
        
        if (labelNumber === null && labelColorInt !== 0) {
          console.warn('Unexpected label color: ' + JSON.stringify(rgbaColor));
        };

        if (labelNumber !== null) {
          dataArray[y][x] = labelNumber;
        }
        
        count++;
      }
    }

    let body = {
      mapId: this.props.map.id,
      timestamp: this.props.timestamp,
      store: true,
      tileId: this.props.tileId,
      measurementName: 'label',
      newData: dataArray
    };

    ApiManager.post('/raster/submit', body, this.props.user)
      .then(() => {
        this.saving = false;
        this.props.onClose();
      })
      .catch(err => {
        this.saving = false;
        alert('An error occurred while saving. Please contact us.');
      });
	}

  onWheel = (e) => {
    if (!this.state.init) {
      return;
    }

    let steps = Math.ceil(e.deltaY / 25);

    if (this.pressedMouseButton === 2) {
      let currPos = {
        offsetX: e.nativeEvent.offsetX ? e.nativeEvent.offsetX : e.nativeEvent.layerX,
        offsetY: e.nativeEvent.offsetY ? e.nativeEvent.offsetY : e.nativeEvent.layerY
      };

      this.changeToolSize(steps, () => {
        this.drawCursor(currPos);
      });
    }
    else {
      this.zoom(steps);
    }

    e.preventDefault();

    return false;
  }
  
	onMouseDown = (e) => {
    if (!this.state.init) {
      return;
    }

    let nativeEvent = e.nativeEvent;
    let currentTool = this.state.tool;

    this.pressedMouseButton = e.buttons;

    nativeEvent.preventDefault();

    let offsetX = nativeEvent.offsetX ? nativeEvent.offsetX : nativeEvent.layerX;
    let offsetY = nativeEvent.offsetY ? nativeEvent.offsetY : nativeEvent.layerY;
    let pos = { offsetX, offsetY };

    if (this.pressedMouseButton === 1 || this.pressedMouseButton === 3) {
      if (currentTool === 'polygon') {
        if (!this.polygonDone) {
          this.polygonCoords.push(pos);
          this.drawPolygon();
        }
      } 
      else {
			  this.paint(pos, pos, this.state.strokeSize);
      }
    }

    this.prevMousePos = pos;
  }

	onMouseMove = (e) => {
    if (!this.state.init) {
      return;
    }

    let currentTool = this.state.tool;

    let pos = {
      offsetX: e.nativeEvent.offsetX ? e.nativeEvent.offsetX : e.nativeEvent.layerX, 
      offsetY: e.nativeEvent.offsetY ? e.nativeEvent.offsetY : e.nativeEvent.layerY
    };

		if ((this.pressedMouseButton === 1 || this.pressedMouseButton === 3) && this.prevMousePos) {
      if (currentTool === 'labeler' || currentTool === 'eraser') {
        this.paint(this.prevMousePos, pos, this.state.strokeSize);
      }      
    }

    if (currentTool === 'labeler' || currentTool === 'eraser') {
      this.drawCursor(pos);
    }

		this.prevMousePos = pos;
	}
  
  onMouseUp = (e) => {
    if (!this.state.init) {
      return;
    }

    this.pressedMouseButton = e.nativeEvent.buttons;
  }

  onMouseLeave = (e) => {
    if (!this.state.init) {
      return;
    }

    this.onMouseMove(e);

    if (this.state.tool !== 'polygon') {
      this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    this.prevMousePos = null;
    this.mouseOnCanvas = false;
  }

  onMouseEnter = (e) => {
    if (!this.state.init) {
      return;
    }

    let nativeEvent = e.nativeEvent;

    this.pressedMouseButton = e.buttons;

		this.prevMousePos = { 
      offsetX: nativeEvent.offsetX ? nativeEvent.offsetX : nativeEvent.layerX, 
      offsetY: nativeEvent.offsetY ? nativeEvent.offsetY : nativeEvent.layerY
    };

    this.mouseOnCanvas = true;
  }
  
  onToolbarClick = (tool) => {
    if (!this.state.init) {
      return;
    }

    if (tool !== this.state.tool) {
      this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    if (tool === 'labeler') {
      this.setState({ subtoolbar: true, tool: tool });
    }
    else if (tool === 'polygon') {
      this.setState({ subtoolbar: true, tool: tool })
    }
    else if (tool === 'eraser') {
      this.setState({ tool: 'eraser', drawingClass: ERASER_CLASS });
    }
    else if (tool === 'toggle-label-layer') {
      this.setState({ hideLabel: !this.state.hideLabel })
    }
    else if (tool === 'save') {
      this.saveCanvas();
    }
  }

  onSubToolbarClick = (_class) => {
    if (!this.state.init) {
      return;
    }

    this.setState({ 
      drawingClass: _class, 
      subtoolbar: false 
    });
  }
	
	renderToolbar() {
    let subtoolbar = null;
    if (this.state.subtoolbar) {
      let classButtons = [];

      let classesInfo = this.state.classes;

      for (let i = 0; i < classesInfo.length; i++) {
        let _class = classesInfo[i];

        if (IGNORE_CLASSES.includes(_class.name)) {
          continue;
        }

        let style = {
          color: _class.color
        };

        classButtons.push((
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onSubToolbarClick(_class)}
            >
              <CircleIcon style={style}/>
              {_class.name}
            </IconButton>
          </NavItem> 
        )); 
      }

      subtoolbar = (
        <Nav className='flex-column annotate-toolbar annotate-subtoolbar'>
          {classButtons}
        </Nav>
      );
    }

    return (
      <div>
        <Nav className='flex-column annotate-toolbar'>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onToolbarClick('labeler')}              
            >
              <FontAwesomeIcon icon={faPen} />              
            </IconButton>
          </NavItem>       
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onToolbarClick('polygon')}
            >
              <FontAwesomeIcon icon={faDrawPolygon} />
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onToolbarClick('eraser')}              
            >
              <FontAwesomeIcon icon={faEraser} />              
            </IconButton>
          </NavItem>  
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onToolbarClick('toggle-label-layer')}              
            >
              <FontAwesomeIcon icon={faEyeSlash} />
            </IconButton>
          </NavItem>  
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.changeToolSize(STROKE_STEP * 5)}              
            >
              <FontAwesomeIcon icon={faPlus} />              
            </IconButton>
          </NavItem>   
          <NavItem>
            <IconButton
              className='tool-button text-button'
              color='secondary'             
            >
              {this.state.strokeSize}
            </IconButton>
          </NavItem> 
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.changeToolSize(-STROKE_STEP * 5)}              
            >
              <FontAwesomeIcon icon={faMinus} />              
            </IconButton>
          </NavItem> 
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.zoom(3)}              
            >
              <FontAwesomeIcon icon={faSearchPlus} />
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.zoom(-3)}              
            >
              <FontAwesomeIcon icon={faSearchMinus} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onToolbarClick('save')}              
            >
              <FontAwesomeIcon icon={faSave} />              
            </IconButton>
          </NavItem>
        </Nav>
        {subtoolbar}
      </div>      
    );
	}	

	render() {
    let labelLayerOpacity = null;
    if (this.state.hideLabel) {
      labelLayerOpacity = 0.0;
    }

		return (
      <div>
        <div 
          className='canvas'
          onContextMenu={e => e.preventDefault()}
          onMouseDown={this.onMouseDown} 
          onMouseUp={this.onMouseUp}
          onWheel={this.onWheel}
        >
          <div 
            id='canvases'
            onClick={() => this.setState({ subtoolbar: false })}
            onMouseLeave={this.onMouseLeave}
            onMouseOver={this.onMouseEnter}          
            onMouseMove={this.onMouseMove}
            tabIndex='0'
          >
            <canvas id='layer-bottom' className='layers'
              ref={this.canvas0}
              style = {{ zIndex: 0 }}
            />
            <canvas id='layer-upper' className='layers'
              ref={this.canvas1}
              style = {{ zIndex: 1, opacity: labelLayerOpacity }}
            />
            <canvas id='layer-temp' className='layers'
              ref={this.canvasTemp}
              style = {{ zIndex: 2 }}
            />
          </div>
        </div>
        {this.renderToolbar()}
      </div>     
		);
	}
}

function aliasedCircle(canvas, xc, yc, r) {  // NOTE: for fill only!
  var x = r, y = 0, cd = 0;

  canvas.beginPath();

  // middle line
  canvas.rect(xc - x, yc, r<<1, 1);

  while (x > y) {
    cd -= (--x) - (++y);
    if (cd < 0) cd += x++;
    canvas.rect(xc - y, yc - x, y<<1, 1);    // upper 1/4
    canvas.rect(xc - x, yc - y, x<<1, 1);    // upper 2/4
    canvas.rect(xc - x, yc + y, x<<1, 1);    // lower 3/4
    canvas.rect(xc - y, yc + x, y<<1, 1);    // lower 4/4
  }

  canvas.closePath();
}

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
	    r: parseInt(result[1], 16),
	    g: parseInt(result[2], 16),
	    b: parseInt(result[3], 16),
	    a: 255
	} : null;
}

function getUnsignedRgba(color) {
	let r = color.r & 0xFF;
	let g = color.g & 0xFF;
	let b = color.b & 0xFF;
	let a = color.a & 0xFF;
	// Ending bit wise ops with >>> 0 to make it unsigned
	return ((a << 24) | (b << 16) | (g << 8) | (r)) >>> 0;
}

function getRgbaColor(color) { 
	return {
	    a: color >>> 24 & 0xFF,
	    b: color >>> 16 & 0xFF,
	    g: color >>> 8 & 0xFF,
	    r: color & 0xFF
	};
}

export default AnnotateTool;
