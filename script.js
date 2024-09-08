const uploadImage = document.getElementById("upload-image");
const uploadEmblem = document.getElementById("upload-emblem");
const emblemPreview = document.getElementById("emblem-preview");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageTypeRadios = document.getElementsByName("image-type");
const emblemSizeRadios = document.getElementsByName("emblem-size");
const emblemPositionRadios = document.getElementsByName("emblem-position");
const downloadBtn = document.getElementById("download-btn");
const imageToCrop = document.getElementById("image-to-crop");
const emblem = document.getElementById("emblem");
const backgroundInputs = document.getElementsByName("background-type");
const customUpload = uploadImage;
const presetOptions = document.getElementById("preset-options");
const uploadOptions = document.getElementById("upload-options");
const presetToggle = document.getElementById("preset-toggle");
const uploadToggle = document.getElementById("upload-toggle");

const typeImages = {
  type1: "001.png",
  type2: "002.png",
  type3: "003.png",
  type4: "004.png",
};

const defaultEmblems = ['logo.png', 'unko.png'];

let cropper;
let emblemPosition = { x: 0, y: 0 };
let isDragging = false;
let emblemWidth = 250; // 初期エンブレムサイズ
let emblemHeight = 207;
let emblemAspectRatio = emblemWidth / emblemHeight;

let filterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0
};

function updateFilter() {
  updateCanvas();
}

document.querySelectorAll('.filter-slider').forEach(slider => {
  slider.addEventListener('input', (e) => {
    const filterId = e.target.id;
    const value = e.target.value;
    console.log(value)
    console.log(filterId)
    filterSettings[filterId] = value;
    document.getElementById(`${filterId}-value`).textContent = filterId === 'hueRotate' ? `${value}deg` : `${value}%`;
    updateFilter();
  });
});

document.getElementById('reset-filters').addEventListener('click', (e) => {
  e.preventDefault()
  filterSettings = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0
  };
  document.querySelectorAll('.filter-slider').forEach(slider => {
    slider.value = filterSettings[slider.id];
    document.getElementById(`${slider.id}-value`).textContent = slider.id === 'hueRotate' ? '0deg' : '100%';
  });
  updateFilter();
});


backgroundInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    if (input.value === "custom") {
      customUpload.style.display = "block";
      imageToCrop.src = ""; // 保持していたカスタム画像をクリア
    } else {
      customUpload.style.display = "none";
      imageToCrop.src = typeImages[input.value];
      imageToCrop.crossorigin = "anonymous";
      initCropper();
    }
  });
});

emblemSizeRadios.forEach((radio) => {
  radio.addEventListener("change", updateEmblemSize);
});

presetToggle.addEventListener("click", () => {
  presetOptions.style.display = "block"; // プリセット選択フィールドを表示
  uploadOptions.style.display = "none"; // アップロードフィールドを非表示
  customUpload.style.display = "none"; // カスタムアップロードの表示も非表示にする可能性があります
});

uploadToggle.addEventListener("click", () => {
  presetOptions.style.display = "none"; // プリセット選択フィールドを非表示
  uploadOptions.style.display = "block"; // アップロードフィールドを表示
  customUpload.style.display = "block"; // カスタムアップロードフィールドを表示
});

function getScaleFactor() {
  const rect = canvas.getBoundingClientRect();
  return {
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height,
  };
}

canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", doDrag);
canvas.addEventListener("mouseup", endDrag);
canvas.addEventListener("touchstart", startDrag);
canvas.addEventListener("touchmove", doDrag);
canvas.addEventListener("touchend", endDrag);

function startDrag(e) {
  const rect = canvas.getBoundingClientRect();
  const scale = getScaleFactor();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = (clientX - rect.left) * scale.scaleX;
  const y = (clientY - rect.top) * scale.scaleY;

  if (
    x >= emblemPosition.x &&
    x <= emblemPosition.x + emblemWidth &&
    y >= emblemPosition.y &&
    y <= emblemPosition.y + emblemHeight
  ) {
    isDragging = true;
  }
}

function doDrag(e) {
  if (isDragging) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scale = getScaleFactor();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    emblemPosition.x = (clientX - rect.left) * scale.scaleX - emblemWidth / 2;
    emblemPosition.y = (clientY - rect.top) * scale.scaleY - emblemHeight / 2;
    constrainEmblem();
    updateCanvas();
  }
}

function endDrag() {
  isDragging = false;
}

uploadImage.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageToCrop.src = e.target.result;
      initCropper();
      saveImageToLocalStorage(e.target.result);
      addImageToPresetOptions(e.target.result);
    };
    reader.readAsDataURL(file);
  }
});

uploadEmblem.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      emblem.onload = () => {
        emblemAspectRatio = emblem.width / emblem.height;
        emblemPreview.src = e.target.result;
        emblemPreview.style.display = "block";
        updateEmblemSize();
        updateCanvas();
        saveEmblemToLocalStorage(e.target.result);
        addEmblemToPresetOptions(e.target.result);
      };
      emblem.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function updateEmblemSize() {
  const size = document.querySelector(
    'input[name="emblem-size"]:checked'
  ).value;
  if (size === "large") {
    emblemWidth = 454;
    emblemHeight = emblemWidth / emblemAspectRatio;
  } else if (size === "medium") {
    emblemWidth = 300;
    emblemHeight = emblemWidth / emblemAspectRatio;
  } else if (size === "small") {
    emblemWidth = 200;
    emblemHeight = emblemWidth / emblemAspectRatio;
  } else if (size === "x-small") {
    emblemWidth = 100;
    emblemHeight = emblemWidth / emblemAspectRatio;
  }
  updateCanvas();
}

function initCropper() {
  if (cropper) {
    cropper.destroy();
  }

  const aspectRatio =
    document.querySelector('input[name="image-type"]:checked').value ===
    "header"
      ? 3 / 1
      : document.querySelector('input[name="image-type"]:checked').value ===
        "icon"
      ? 1
      : NaN;

  cropper = new Cropper(imageToCrop, {
    aspectRatio: aspectRatio,
    viewMode: 1,
    background: false,
    autoCropArea: 1,
    ready() {
      updateCanvas();
    },
    crop() {
      updateCanvas();
    },
  });
}

function updateCanvas() {
  if (!cropper) return;

  document.querySelectorAll(".img-placeholder").forEach((el) => {
    el.remove();
  });

  const type = document.querySelector('input[name="image-type"]:checked').value;

  switch (type) {
    case "header":
      canvas.width = 1500;
      canvas.height = 500;
      canvas.classList.remove("icon-preview");
      break;
    case "icon":
      canvas.width = 800;
      canvas.height = 800;
      canvas.classList.add("icon-preview");
      break;
    case "custom-size":
      const cropData = cropper.getData();
      canvas.width = cropData.width;
      canvas.height = cropData.height;
      canvas.classList.remove("icon-preview");
      break;
  }

  constrainEmblem();

  const croppedImage = cropper.getCroppedCanvas({
    width: canvas.width,
    height: canvas.height,
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 背景画像を描画
  ctx.drawImage(croppedImage, 0, 0);

  // フィルターを適用
  applyFilters();
  
  // エンブレムを描画
  ctx.drawImage(
    emblem,
    emblemPosition.x,
    emblemPosition.y,
    emblemWidth,
    emblemHeight
  );

  if (type === "icon") {
    ctx.beginPath();
    ctx.arc(400, 400, 400, 0, Math.PI * 2);
    ctx.clip();
  }

  canvas.style.width = "100%";
}

function applyFilters() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // 元の画像を一時的なキャンバスにコピー
  tempCtx.drawImage(canvas, 0, 0);

  // フィルターを適用
  tempCtx.filter = `brightness(${filterSettings.brightness}%) contrast(${filterSettings.contrast}%) saturate(${filterSettings.saturation}%) hue-rotate(${filterSettings.hueRotate}deg)`;
  console.log(tempCtx.filter)
  tempCtx.drawImage(tempCanvas, 0, 0);

  // フィルターを適用した画像を元のキャンバスに描画
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
}

function constrainEmblem() {
  if (emblemPosition.x < 0) emblemPosition.x = 0;
  if (emblemPosition.y < 0) emblemPosition.y = 0;
  if (emblemPosition.x + emblemWidth > canvas.width)
    emblemPosition.x = canvas.width - emblemWidth;
  if (emblemPosition.y + emblemHeight > canvas.height)
    emblemPosition.y = canvas.height - emblemHeight;
}

downloadBtn.addEventListener("click", (e) => {
  e.preventDefault();
  updateCanvas(); // フィルターを適用した状態でキャンバスを更新
  const isIOS =
    !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  if (isIOS) {
    canvas.toBlob((blob) => {
      const newImg = document.createElement("img"),
        url = URL.createObjectURL(blob);
      newImg.onload = () => {
        URL.revokeObjectURL(url);
      };
      newImg.src = url;
      const link = document.createElement("a");
      link.href = newImg.src;
      link.target = "_blank";
      link.download =
        imageTypeRadios.value === "header" ? "x-header.png" : "x-icon.png";
      link.click();
    });
  } else {
    const link = document.createElement("a");
    link.download =
      imageTypeRadios.value === "header" ? "x-header.png" : "x-icon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
});

imageTypeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (cropper) {
      const aspectRatio =
        document.querySelector('input[name="image-type"]:checked').value ===
        "header"
          ? 3 / 1
          : document.querySelector('input[name="image-type"]:checked').value ===
            "icon"
          ? 1
          : NaN;
      cropper.setAspectRatio(aspectRatio);
      updateCanvas();
    }
  });
});

// エンブレム位置のラジオボタンをクリックで位置を変更
emblemPositionRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    setEmblemPosition(radio.value);
    updateCanvas();
  });
});

function setEmblemPosition(position) {
  switch (position) {
    case "top-left":
      emblemPosition.x = 0;
      emblemPosition.y = 0;
      break;
    case "top-center":
      emblemPosition.x = (canvas.width - emblemWidth) / 2;
      emblemPosition.y = 0;
      break;
    case "top-right":
      emblemPosition.x = canvas.width - emblemWidth;
      emblemPosition.y = 0;
      break;
    case "center-left":
      emblemPosition.x = 0;
      emblemPosition.y = (canvas.height - emblemHeight) / 2;
      break;
    case "center":
      emblemPosition.x = (canvas.width - emblemWidth) / 2;
      emblemPosition.y = (canvas.height - emblemHeight) / 2;
      break;
    case "center-right":
      emblemPosition.x = canvas.width - emblemWidth;
      emblemPosition.y = (canvas.height - emblemHeight) / 2;
      break;
    case "bottom-left":
      emblemPosition.x = 0;
      emblemPosition.y = canvas.height - emblemHeight;
      break;
    case "bottom-center":
      emblemPosition.x = (canvas.width - emblemWidth) / 2;
      emblemPosition.y = canvas.height - emblemHeight;
      break;
    case "bottom-right":
      emblemPosition.x = canvas.width - emblemWidth;
      emblemPosition.y = canvas.height - emblemHeight;
      break;
  }
  constrainEmblem();
}

// ローカルストレージに画像を保存
function saveImageToLocalStorage(imageData) {
  let images = JSON.parse(localStorage.getItem("uploadedImages")) || [];
  images.push(imageData);
  localStorage.setItem("uploadedImages", JSON.stringify(images));
}

// エンブレムをローカルストレージに保存
function saveEmblemToLocalStorage(emblemData) {
  let emblems = JSON.parse(localStorage.getItem("uploadedEmblems")) || [];
  emblems.push(emblemData);
  localStorage.setItem("uploadedEmblems", JSON.stringify(emblems));
}

// プリセットオプションに画像を追加
function addImageToPresetOptions(imageData) {
  const newOption = document.createElement("div");
  newOption.classList.add("form-check", "form-check-inline");
  const newInput = document.createElement("input");
  newInput.classList.add("btn-check");
  newInput.type = "radio";
  newInput.name = "background-type";
  newInput.value = imageData;
  newInput.id = `custom-${Date.now()}`;
  newOption.appendChild(newInput);
  const newLabel = document.createElement("label");
  newLabel.classList.add("form-check-label");
  newLabel.htmlFor = newInput.id;
  const newImg = document.createElement("img");
  newImg.src = imageData;
  newImg.classList.add("thumbnail");
  newLabel.appendChild(newImg);
  newOption.appendChild(newLabel);
  
  // 削除ボタンを追加
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "削除";
  deleteButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
  newOption.appendChild(deleteButton);

  presetOptions.querySelector(".thumbnail-container").appendChild(newOption);

  newInput.addEventListener("change", () => {
    imageToCrop.src = imageData;
    imageToCrop.crossorigin = "anonymous";
    initCropper();
  });

  deleteButton.addEventListener("click", () => {
    removeImageFromLocalStorage(imageData);
    newOption.remove();
  });
}

// プリセットオプションにエンブレムを追加
function addEmblemToPresetOptions(emblemData, isDefault = false) {
  const newOption = document.createElement("div");
  newOption.classList.add("form-check", "form-check-inline");
  const newInput = document.createElement("input");
  newInput.classList.add("btn-check");
  newInput.type = "radio";
  newInput.name = "emblem-type";
  newInput.value = emblemData;
  newInput.id = `custom-emblem-${Date.now()}-${newInput.value}`;
  newOption.appendChild(newInput);
  const newLabel = document.createElement("label");
  newLabel.classList.add("form-check-label");
  newLabel.htmlFor = newInput.id;
  const newImg = document.createElement("img");
  newImg.src = emblemData;
  newImg.classList.add("thumbnail");
  newLabel.appendChild(newImg);
  newOption.appendChild(newLabel);
  
  // デフォルトのエンブレムでない場合のみ削除ボタンを追加
  if (!isDefault) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
    newOption.appendChild(deleteButton);

    deleteButton.addEventListener("click", () => {
      removeEmblemFromLocalStorage(emblemData);
      newOption.remove();
    });
  }

  document.getElementById("emblem-preset-options").appendChild(newOption);

  newInput.addEventListener("change", () => {
    emblem.src = emblemData;
    emblem.crossorigin = "anonymous";
    emblem.onload = () => {
      emblemAspectRatio = emblem.width / emblem.height;
      updateEmblemSize();
      updateCanvas();
    };
  });
}


// ローカルストレージから画像を削除
function removeImageFromLocalStorage(imageData) {
  let images = JSON.parse(localStorage.getItem("uploadedImages")) || [];
  images = images.filter((image) => image !== imageData);
  localStorage.setItem("uploadedImages", JSON.stringify(images));
}

// ローカルストレージからエンブレムを削除
function removeEmblemFromLocalStorage(emblemData) {
  let emblems = JSON.parse(localStorage.getItem("uploadedEmblems")) || [];
  emblems = emblems.filter((emblem) => emblem !== emblemData);
  localStorage.setItem("uploadedEmblems", JSON.stringify(emblems));
}

// 初期設定：ローカルストレージから画像を読み込み、プリセットオプションに追加
function loadImagesFromLocalStorage() {
  const images = JSON.parse(localStorage.getItem("uploadedImages")) || [];
  images.forEach((imageData) => {
    addImageToPresetOptions(imageData);
  });
}

// 初期設定：ローカルストレージ���らエンブレムを読み込み、プリセットオプションに追加
function loadEmblemsFromLocalStorage() {
  // エンブレムプリセットオプションをクリア
  const emblemPresetOptions = document.getElementById("emblem-preset-options");
  emblemPresetOptions.innerHTML = '';

  // デフォルトのエンブレムを追加
  defaultEmblems.forEach((emblemData) => {
    addEmblemToPresetOptions(emblemData, true);
  });

  // ローカルストレージから追加のエンブレムを読み込む
  const emblems = JSON.parse(localStorage.getItem("uploadedEmblems")) || [];
  emblems.forEach((emblemData) => {
    addEmblemToPresetOptions(emblemData);
  });

  // 最初のエンブレムを選択状態にする
  const firstEmblemInput = emblemPresetOptions.querySelector('input[type="radio"]');
  if (firstEmblemInput) {
    firstEmblemInput.checked = true;
    firstEmblemInput.dispatchEvent(new Event('change'));
  }
}


document.addEventListener('DOMContentLoaded', () => {
  loadImagesFromLocalStorage();
  loadEmblemsFromLocalStorage();

  // 初期設定：customが選択されているので、アップロードフィールドを表示
  presetOptions.style.display = "block";
  customUpload.style.display = "none";

  // 初期設定：中サイズのエンブレムを中央に配置
  emblemPositionRadios[4].checked = true; // 中央のラジオボタンをチェック
  setEmblemPosition("center"); // 中央に配置
  updateCanvas();
});