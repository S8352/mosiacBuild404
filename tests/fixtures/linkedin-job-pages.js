// Job Copilot - QA Test Fixtures for LinkedIn Job Pages
// These fixtures simulate different LinkedIn Easy Apply job page structures

const linkedInJobFixtures = {
  // Standard Software Engineer Job
  softwareEngineer: {
    url: 'https://www.linkedin.com/jobs/view/3234567890',
    html: `
      <div class="job-details-jobs-unified-top-card__job-title">
        <h1>Senior Software Engineer</h1>
      </div>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a href="/company/google">Google</a>
      </div>
      <div class="job-details-jobs-unified-top-card__primary-description-container">
        <span class="tvm__text">Mountain View, CA</span>
      </div>
      <div class="job-details-jobs-unified-top-card__job-description">
        <div class="tvm__text">
          We are looking for a Senior Software Engineer to join our team. 
          Requirements: 5+ years of experience in JavaScript, React, Node.js, 
          and cloud technologies. Strong problem-solving skills and experience 
          with agile development methodologies.
        </div>
      </div>
    `,
    expectedData: {
      title: 'Senior Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      skills: ['javascript', 'react', 'node.js', 'agile', 'problem solving'],
      seniority: 'Senior',
      employmentType: 'Full-time'
    }
  },

  // Data Scientist Position
  dataScientist: {
    url: 'https://www.linkedin.com/jobs/view/3234567891',
    html: `
      <div class="jobs-unified-top-card__job-title">
        <h1>Data Scientist</h1>
      </div>
      <div class="jobs-unified-top-card__company-name">
        <a href="/company/microsoft">Microsoft</a>
      </div>
      <div class="jobs-unified-top-card__bullet">
        Seattle, WA
      </div>
      <div class="jobs-description__content">
        Join our AI team as a Data Scientist. Required skills include Python, 
        machine learning, TensorFlow, statistical analysis, and data visualization. 
        PhD in Computer Science or related field preferred.
      </div>
    `,
    expectedData: {
      title: 'Data Scientist',
      company: 'Microsoft',
      location: 'Seattle, WA',
      skills: ['python', 'machine learning', 'tensorflow', 'data science'],
      seniority: 'Mid-level',
      employmentType: 'Full-time'
    }
  },

  // Product Manager Role
  productManager: {
    url: 'https://www.linkedin.com/jobs/view/3234567892',
    html: `
      <h1 data-test-id="job-title">Product Manager</h1>
      <div data-test-id="job-details-company-name">
        <a href="/company/amazon">Amazon</a>
      </div>
      <span data-test-id="job-details-location">Austin, TX</span>
      <div data-test-id="job-details-description">
        We're seeking a Product Manager to lead our e-commerce initiatives. 
        Requirements include 3+ years of product management experience, 
        strong analytical skills, experience with A/B testing, and excellent 
        communication abilities. MBA preferred.
      </div>
    `,
    expectedData: {
      title: 'Product Manager',
      company: 'Amazon',
      location: 'Austin, TX',
      skills: ['product management', 'analytical thinking', 'communication'],
      seniority: 'Mid-level',
      employmentType: 'Full-time'
    }
  },

  // Entry Level Position
  juniorDeveloper: {
    url: 'https://www.linkedin.com/jobs/view/3234567893',
    html: `
      <div class="job-details-jobs-unified-top-card__job-title">
        <h1>Junior Frontend Developer</h1>
      </div>
      <div class="job-details-jobs-unified-top-card__company-name">
        Startup Inc.
      </div>
      <div class="job-details-jobs-unified-top-card__primary-description">
        <span class="tvm__text">San Francisco, CA</span>
      </div>
      <div class="jobs-box__html-content">
        Entry-level position for a Junior Frontend Developer. 
        Requirements: HTML, CSS, JavaScript, React basics. 
        Fresh graduates welcome. Great learning opportunity!
      </div>
    `,
    expectedData: {
      title: 'Junior Frontend Developer',
      company: 'Startup Inc.',
      location: 'San Francisco, CA',
      skills: ['html', 'css', 'javascript', 'react'],
      seniority: 'Junior',
      employmentType: 'Full-time'
    }
  },

  // Remote Position
  remoteRole: {
    url: 'https://www.linkedin.com/jobs/view/3234567894',
    html: `
      <div class="job-details-jobs-unified-top-card__job-title">
        <h1>DevOps Engineer - Remote</h1>
      </div>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a href="/company/tech-corp">TechCorp</a>
      </div>
      <div class="job-details-jobs-unified-top-card__primary-description-container">
        <span class="tvm__text">Remote</span>
      </div>
      <div class="job-details-jobs-unified-top-card__job-description">
        Remote DevOps Engineer position. Skills required: AWS, Docker, 
        Kubernetes, CI/CD pipelines, monitoring tools, and scripting. 
        5+ years of experience in cloud infrastructure.
      </div>
    `,
    expectedData: {
      title: 'DevOps Engineer - Remote',
      company: 'TechCorp',
      location: 'Remote',
      skills: ['aws', 'docker', 'kubernetes', 'ci/cd'],
      seniority: 'Senior',
      employmentType: 'Full-time'
    }
  }
};

// Form field fixtures for autofill testing
const formFixtures = {
  standardApplicationForm: {
    html: `
      <form id="easy-apply-form">
        <input name="firstName" placeholder="First Name" />
        <input name="lastName" placeholder="Last Name" />
        <input type="email" name="email" placeholder="Email Address" />
        <input type="tel" name="phone" placeholder="Phone Number" />
        <input name="location" placeholder="Current Location" />
        <textarea name="summary" placeholder="Professional Summary"></textarea>
        <select name="experience">
          <option value="">Years of Experience</option>
          <option value="0-1">0-1 years</option>
          <option value="2-5">2-5 years</option>
          <option value="5+">5+ years</option>
        </select>
      </form>
    `,
    expectedFields: [
      'firstName', 'lastName', 'email', 'phone', 'location', 'summary', 'experience'
    ]
  },

  linkedInEasyApplyForm: {
    html: `
      <div class="jobs-easy-apply-content">
        <input id="easyApplyFormElement-0" placeholder="First name" />
        <input id="easyApplyFormElement-1" placeholder="Last name" />
        <input id="easyApplyFormElement-2" type="email" placeholder="Email" />
        <input id="easyApplyFormElement-3" type="tel" placeholder="Mobile phone number" />
        <select id="easyApplyFormElement-4">
          <option>How many years of work experience do you have?</option>
          <option value="1">Less than 1 year</option>
          <option value="2">1-2 years</option>
          <option value="5">3-5 years</option>
          <option value="10">5+ years</option>
        </select>
      </div>
    `,
    expectedFields: [
      'easyApplyFormElement-0', 'easyApplyFormElement-1', 
      'easyApplyFormElement-2', 'easyApplyFormElement-3', 'easyApplyFormElement-4'
    ]
  },

  customQuestionsForm: {
    html: `
      <form class="application-form">
        <input name="fullName" placeholder="Full Name" />
        <input type="email" name="email" placeholder="Email" />
        <textarea name="coverLetter" placeholder="Why are you interested in this role?"></textarea>
        <input name="salary" placeholder="Expected salary range" />
        <input name="startDate" placeholder="When can you start?" />
        <select name="authorization">
          <option>Are you authorized to work in the US?</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </form>
    `,
    expectedFields: ['fullName', 'email', 'coverLetter', 'salary', 'startDate', 'authorization'],
    newQuestions: [
      'Why are you interested in this role?',
      'Expected salary range',
      'When can you start?',
      'Are you authorized to work in the US?'
    ]
  }
};

// Test profile data
const testProfileData = {
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  professionalHeadline: 'Senior Software Engineer',
  profileSummary: 'Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud technologies.',
  workExperience: [
    {
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      startDate: '01/2020',
      endDate: 'Present',
      description: 'Lead development of web applications using React and Node.js',
      achievements: ['Increased application performance by 40%', 'Led team of 5 developers']
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'Stanford University',
      startDate: '09/2012',
      endDate: '06/2016',
      gpa: '3.8'
    }
  ],
  hardSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
  softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork'],
  certifications: ['AWS Certified Solutions Architect'],
  quantifiableAchievements: [
    'Increased system performance by 40%',
    'Reduced deployment time by 60%',
    'Led team of 5 developers'
  ]
};

module.exports = {
  linkedInJobFixtures,
  formFixtures,
  testProfileData
};
