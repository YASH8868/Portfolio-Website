if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask to use this site.");
}

const contractAddress = "0x9A78d49Bb3D2220b595B79AEC63e66aA86Cd032b";
const contractABI =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "MAX_PROJECTS",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			}
		],
		"name": "addProject",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "deleteProject",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPortfolio",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getProject",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getProjectCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_bio",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_skills",
				"type": "string"
			}
		],
		"name": "updateBasicInfo",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_email",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_linkedin",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_github",
				"type": "string"
			}
		],
		"name": "updateContactInfo",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
let provider, signer, contract, userAddress;

const readOnlyContract = new ethers.Contract(
  contractAddress,
  contractABI,
  new ethers.providers.Web3Provider(window.ethereum).getSigner()
);

// 🚀 On Load: Initialize with Read-Only Contract
window.addEventListener("load", async () => {
  if (!window.ethereum) return alert("MetaMask is not installed.");
  await loadPortfolio(readOnlyContract);
  await loadProjects(readOnlyContract, false); // false = not owner
  toggleUpdateButton(false);
});

// 🔌 Connect Wallet
document.getElementById("connectWallet").addEventListener("click", async () => {
  if (!window.ethereum) return alert("MetaMask not detected.");

  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) return alert("No MetaMask account found.");

    userAddress = accounts[0];
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    const owner = await contract.owner();
    const isOwner = userAddress.toLowerCase() === owner.toLowerCase();

    toggleUpdateButton(isOwner);
    if (!isOwner) alert("Unauthorized: You are not the contract owner.");

    await loadPortfolio(contract);
    await loadProjects(contract, isOwner); // true if owner
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Could not connect to MetaMask.");
  }
});

function toggleUpdateButton(show) {
  document.getElementById("updateBtn").style.display = show ? "block" : "none";
}

// 📂 Load Projects with owner control
async function loadProjects(activeContract, isOwner) {
  try {
    const count = await activeContract.getProjectCount();
    const container = document.getElementById("projects-container");
    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const [title, desc] = await activeContract.getProject(i);
      const projectDiv = document.createElement("div");
      projectDiv.className = "project";
      projectDiv.innerHTML = `
        <p><strong>${title}</strong><br>${desc}</p>
        ${isOwner ? `
          <button class="edit-btn" onclick="editProject(${i}, '${title}', \`${desc}\`)">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteProject(${i})">🗑️ Delete</button>
        ` : ''}
      `;
      container.appendChild(projectDiv);
    }
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

// 📦 Load Portfolio Info
async function loadPortfolio(activeContract) {
  try {
    const [name, bio, skills, email, linkedin, github] = await activeContract.getPortfolio();
    window.existingData = { name, bio, skills, email, linkedin, github };
    updateFrontendUI(window.existingData);
  } catch (err) {
    console.error("Failed to load portfolio:", err);
  }
}

// ✏️ Edit Project
function editProject(index, title, description) {
  openModal("projects");
  document.getElementById("projectTitle").value = title;
  document.getElementById("projectDescription").value = description;
  document.getElementById("editProjectIndex").value = index;
}

// 🗑️ Delete Project
async function deleteProject(index) {
  if (!contract) return alert("Wallet not connected");
  try {
    const tx = await contract.deleteProject(index);
    await tx.wait();
    alert("Project deleted!");
    await loadProjects(contract, true);
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete project.");
  }
}

// ➕ Open Modal
document.getElementById("updateBtn").onclick = () => {
  const data = window.existingData || {};
  document.getElementById("modalName").value = data.name || "";
  document.getElementById("modalBio").value = data.bio || "";
  document.getElementById("modalSkills").value = data.skills || "";
  document.getElementById("modalEmail").value = data.email || "";
  document.getElementById("modalLinkedin").value = data.linkedin || "";
  document.getElementById("modalGithub").value = data.github || "";
  document.getElementById("projectTitle").value = "";
  document.getElementById("projectDescription").value = "";
  document.getElementById("editProjectIndex").value = "";

  openModal("basic");
};

function openModal(section) {
  document.getElementById("updateModal").style.display = "block";
  document.getElementById("updateSectionSelector").value = section;
  toggleModalSections(section);
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("updateModal").style.display = "none";
};

document.getElementById("updateSectionSelector").addEventListener("change", function () {
  toggleModalSections(this.value);
});

function toggleModalSections(section) {
  document.getElementById("basicFields").style.display = section === "basic" ? "block" : "none";
  document.getElementById("contactFields").style.display = section === "contact" ? "block" : "none";
  document.getElementById("projectFields").style.display = section === "projects" ? "block" : "none";
}

// 💾 Save Changes
document.getElementById("saveChangesBtn").onclick = async () => {
  const section = document.getElementById("updateSectionSelector").value;
  if (!contract || !section) return alert("Connect wallet and select a section.");

  const data = { ...window.existingData };
  try {
    document.getElementById("saveChangesBtn").disabled = true;

    if (section === "basic") {
      const name = document.getElementById("modalName").value.trim() || data.name;
      const bio = document.getElementById("modalBio").value.trim() || data.bio;
      const skills = document.getElementById("modalSkills").value.trim() || data.skills;

      if (name !== data.name || bio !== data.bio || skills !== data.skills) {
        const tx = await contract.updateBasicInfo(name, bio, skills);
        await tx.wait();
        Object.assign(data, { name, bio, skills });
      }
    }

    if (section === "contact") {
      const email = document.getElementById("modalEmail").value.trim() || data.email;
      const linkedin = document.getElementById("modalLinkedin").value.trim() || data.linkedin;
      const github = document.getElementById("modalGithub").value.trim() || data.github;

      if (email !== data.email || linkedin !== data.linkedin || github !== data.github) {
        const tx = await contract.updateContactInfo(email, linkedin, github);
        await tx.wait();
        Object.assign(data, { email, linkedin, github });
      }
    }

    if (section === "projects") {
      const title = document.getElementById("projectTitle").value.trim();
      const description = document.getElementById("projectDescription").value.trim();
      const editIndex = document.getElementById("editProjectIndex").value;

      if (!title || !description) return alert("Enter both title and description.");

      const tx = editIndex
        ? await contract.updateProject(parseInt(editIndex), title, description)
        : await contract.addProject(title, description);

      await tx.wait();
      alert(editIndex ? "Project updated!" : "Project added!");
      await loadProjects(contract, true);
    }

    window.existingData = { ...data };
    updateFrontendUI(data);
    document.getElementById("updateModal").style.display = "none";
    alert("Portfolio updated!");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Update failed. See console.");
  } finally {
    document.getElementById("saveChangesBtn").disabled = false;
  }
};

// 🖼️ Update Frontend
function updateFrontendUI(data) {
  document.getElementById("about").innerHTML = `
    <img src="images/profile.jpg" alt="Profile Picture">
    <h2>${data.name}</h2>
    <p>${data.bio}</p>`;

  document.getElementById("skills").innerHTML = `
    <h2>Skills</h2>
    <p>${data.skills}</p>`;

  document.getElementById("contact").innerHTML = `
    <h2>Contact Me</h2>
    <div class="contact-icons">
      <a href="mailto:${data.email}"><i class="fas fa-envelope"></i></a>
      <a href="${data.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>
      <a href="${data.github}" target="_blank"><i class="fab fa-github"></i></a>
    </div>`;
}
