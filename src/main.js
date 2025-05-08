import * as THREE from 'three';
import { ethers } from 'ethers';

const VC_CONTRACT_ADDRESS = "0x96c33CE8A28F76f24B83b156828A65Ccd0452CE7";
const VC_CONTRACT_ABI = [ 
  "function isRegistered(address user) view returns (bool)",
  "function isVerified(address user) view returns (bool)" 
];

let provider, signer, userAddress;
let bpm = 0;
let timer = null;

const pulseSpan = document.getElementById("bpm");
const matchResult = document.getElementById("match-result");
const chatBox = document.querySelector(".chat-ui");
const profileImg = document.getElementById("profileImage");

// 연결 버튼
const connectBtn = document.getElementById("connectWalletBtn");
connectBtn.addEventListener("click", async () => {
  if (!window.ethereum) return alert("MetaMask 설치 필요!");

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("status").innerText = `🧠 연결됨: ${userAddress}`;
    await checkVCVerification(userAddress, provider);
  } catch (err) {
    alert("지갑 연결 실패: " + err.message);
  }
});

// async function checkVCVerification(address, provider) {
//   const vcContract = new ethers.Contract(VC_CONTRACT_ADDRESS, VC_CONTRACT_ABI, provider);

//   try {
//     const isRegistered = await vcContract.isRegistered(address);
//     const statusEl = document.getElementById("status");

//     if (!isRegistered) {
//       statusEl.innerText += "\n❌ VC 미등록 사용자입니다.";
//       document.querySelector(".badge.verified").style.display = "none";
//       return;
//     }

//     const isVerified = await vcContract.isVerified(address);

//     if (isVerified) {
//       statusEl.innerText += "\n✅ Humanity VC 인증 완료!";
//       document.querySelector(".badge.verified").style.display = "inline-block";
//     } else {
//       statusEl.innerText += "\n❌ VC 인증 필요 (인증되지 않음)";
//       document.querySelector(".badge.verified").style.display = "none";
//     }
//   } catch (err) {
//     alert("VC 인증 확인 실패: " + err.message);
//   }
// }
async function checkVCVerification(address, provider) {
  const vcContract = new ethers.Contract(VC_CONTRACT_ADDRESS, VC_CONTRACT_ABI, provider);

  try {
    const isRegistered = await vcContract.isRegistered(address);
    const statusEl = document.getElementById("status");

    if (!isRegistered) {
      statusEl.innerText += "\n❌ VC 미등록 사용자입니다.";
      document.querySelector(".badge.verified").style.display = "none";
    } else {
      const isVerified = await vcContract.isVerified(address);
      if (isVerified) {
        statusEl.innerText += "\n✅ VC 인증 완료!";
        document.querySelector(".badge.verified").style.display = "inline-block";
      } else {
        statusEl.innerText += "\n⚠️ 인증 대기 상태입니다.";
        document.querySelector(".badge.verified").style.display = "none";
      }
    }
  } catch (err) {
    console.error("VC 인증 확인 실패:", err.message);
  }
}

function simulatePulse() {
  bpm = Math.floor(80 + Math.random() * 40);
  pulseSpan.innerText = bpm;
  const circle = document.getElementById("pulse-circle");
  const percent = Math.min(Math.max((bpm - 80) / 40, 0), 1);
  const offset = 283 * (1 - percent);
  circle.style.strokeDashoffset = offset;
}

// VC 등록 요청 UI 처리

let matchingInProgress = false;
let maxBlurLevel = 4;

// 👤 프로필 업데이트 + 매칭 시작 함수
function startMatching(profile) {
  updateProfile(profile);
  chatBox.classList.add("chat-hidden");
  matchResult.style.display = "none";

  const img = document.getElementById("profileImage");
  img.className = "profile-img blurred lv4";
  maxBlurLevel = 4;
  let seconds = 0;

  timer = setInterval(() => {
    simulatePulse();
    seconds++;

    if (bpm >= 85 && maxBlurLevel > 3) {
      img.className = "profile-img blurred lv3";
      maxBlurLevel = 3;
    }
    if (bpm >= 95 && maxBlurLevel > 2) {
      img.className = "profile-img blurred lv2";
      maxBlurLevel = 2;
    }
    if (bpm >= 105 && maxBlurLevel > 1) {
      img.className = "profile-img blurred lv1";
      maxBlurLevel = 1;
    }
    if (bpm >= 115 && maxBlurLevel > 0) {
      img.className = "profile-img blurred none";
      maxBlurLevel = 0;
      clearInterval(timer);
      chatBox.classList.remove("chat-hidden");
      matchResult.innerText = "🎉 매칭 성공!";
      matchResult.style.display = "block";
      matchingInProgress = false; // 더 이상 자동 진행 안 함
      return;
    }

    if (seconds >= 10 && maxBlurLevel > 0) {
      clearInterval(timer);
      matchResult.innerText = "❌ 매칭 실패 (심박수 부족)";
      matchResult.style.display = "block";
      setTimeout(() => {
        matchResult.style.display = "none";
        currentProfile = (currentProfile + 1) % profiles.length;
        startMatching(profiles[currentProfile]); // 자동 다음
      }, 2000);
    }
  }, 1000);
}

// 👉 start 버튼 한 번만 동작
document.getElementById("startBtn").addEventListener("click", () => {
  if (!userAddress) {
    alert("지갑을 먼저 연결해주세요!");
    return;
  }

  if (matchingInProgress) return;
  matchingInProgress = true;

  currentProfile = 0;
  startMatching(profiles[currentProfile]);
});




const requestBtn = document.getElementById("requestRegisterBtn");
requestBtn?.addEventListener("click", async () => {
  const input = document.getElementById("walletRequest");
  const resultEl = document.getElementById("requestResult");
  const address = input.value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    resultEl.innerText = "❌ 유효한 지갑 주소를 입력해주세요.";
    return;
  }
  try {
    console.log("📨 VC 등록 요청됨:", address);
    resultEl.innerText = "✅ 등록 요청이 성공적으로 제출되었습니다.";
  } catch (err) {
    console.error(err);
    resultEl.innerText = "❌ 요청 실패: " + err.message;
  }
});

// 배경 별 애니메이션 (Three.js)
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const starsGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 500; i++) {
  starPositions.push((Math.random() - 0.5) * 10);
  starPositions.push((Math.random() - 0.5) * 10);
  starPositions.push((Math.random() - 0.5) * 10);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03 }));
scene.add(stars);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  stars.rotation.y += 0.0005;
  renderer.render(scene, camera);
}
animate();

const profiles = [
  {
    name: "Jane",
    age: 28,
    interest: "여행, 책, 블록체인",
    img: "/assets/jinew.jpg"
  },
  {
    name: "Minji",
    age: 25,
    interest: "요가, 음악, NFT",
    img: "/assets/minji.jpg"
  },
  {
    name: "Alex",
    age: 31,
    interest: "게임, AI, Web3",
    img: "/assets/Alex.jpg"
  }
];

let currentProfile = 0;

// 프로필 업데이트 함수
function updateProfile(profile) {
  const profileCard = document.querySelector(".profile-info-card");
  profileCard.innerHTML = `
    <p><strong>이름:</strong> ${profile.name}</p>
    <p><strong>나이:</strong> ${profile.age}</p>
    <p><strong>관심사:</strong> ${profile.interest}</p>
    <div class="badge verified">✅ VC 인증됨</div>
    <img id="profileImage" src="${profile.img}" class="profile-img blurred" alt="프로필 이미지" />
  `;
}

// 다음 버튼 누르면 다음 프로필로 전환
document.getElementById("nextBtn").addEventListener("click", () => {
  currentProfile = (currentProfile + 1) % profiles.length;
  updateProfile(profiles[currentProfile]);
  chatBox.classList.add("chat-hidden");
});