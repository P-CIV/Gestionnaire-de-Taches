let indexASupprimer = null;

function supprimerTache(index) {
    indexASupprimer = index;
    document.getElementById("fenetre-suppression").style.display = "flex";
}

document.getElementById("annuler-suppression").addEventListener("click", () => {
    document.getElementById("fenetre-suppression").style.display = "none";
    indexASupprimer = null;
});

document.getElementById("confirmer-suppression").addEventListener("click", () => {
    if (indexASupprimer !== null) {
        tasks.splice(indexASupprimer, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        displayTasks();
        showNotification("Tâche supprimée avec succès");
        indexASupprimer = null;
    }
    document.getElementById("fenetre-suppression").style.display = "none";
});