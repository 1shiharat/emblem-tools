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

let cropper;
let emblemPosition = { x: 0, y: 0 };
let isDragging = false;
let emblemWidth = 250; // 初期エンブレムサイズ
let emblemHeight = 207;
let emblemAspectRatio = emblemWidth / emblemHeight;

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
    emblemWidth = 250;
    emblemHeight = emblemWidth / emblemAspectRatio;
  } else if (size === "small") {
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
  ctx.drawImage(croppedImage, 0, 0);
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
  updateCanvas();
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

// 初期設定：customが選択されているので、アップロードフィールドを表示
console.log(presetOptions);
console.log(customUpload);
presetOptions.style.display = "none";
customUpload.style.display = "block";

// 初期設定：中サイズのエンブレムを中央に配置
console.log(emblemPositionRadios);
emblemPositionRadios[4].checked = true; // 中央のラジオボタンをチェック
setEmblemPosition("center"); // 中央に配置
updateCanvas();
