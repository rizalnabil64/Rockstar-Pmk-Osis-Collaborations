function initCollaboration() {
  const studentBenefitBox = document.getElementById('studentBenefitBox');
  const studentToggle = document.getElementById('pmkStudentToggle');
  const studentId = document.getElementById('pmkStudentId');

  const syncStudentBenefitUI = () => {
    if (!studentBenefitBox || !studentToggle) return;
    const active = studentToggle.checked;
    studentBenefitBox.classList.toggle('is-active', active);
    if (studentId) {
      studentId.required = active;
      if (!active) studentId.classList.remove('is-invalid');
    }
  };

  studentToggle?.addEventListener('change', syncStudentBenefitUI);
  syncStudentBenefitUI();
}
