import mongoose from "mongoose";

const courseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Course title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Course subtitle cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Business",
      ],
    },
    level: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Please select a vaid course",
      },
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Enter a valid price"],
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.virtual("averageRating").get(function () {
  return 0; // placeholder assignment
});

courseSchema.pre('save', function (next){
    if(this.lectures){
        this.totalLectures = this.lectures.length;
    }
    next()
})

const Course = mongoose.model("Course", courseSchema);
export default Course;
