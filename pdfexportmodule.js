class SetlistPDFExporter {
  constructor() {
    this.doc = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 8; // 0.8cm margins
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.contentHeight = this.pageHeight - this.margin * 2;
    this.PT_TO_MM = 0.3528; // Point to mm conversion (1pt = 0.3528mm)

    // Initialize cognitive linguistics data for intelligent shortening
    this.initializeLinguisticData();
  }

  initializeLinguisticData() {
    // High-frequency morphemes that can be abbreviated while maintaining recognition
    this.morphemeMap = {
      // Prefixes (can often be shortened while preserving meaning)
      anti: "ant",
      auto: "aut",
      counter: "cntr",
      inter: "intr",
      micro: "mcr",
      multi: "mlt",
      over: "ovr",
      pre: "pr",
      pro: "pr",
      pseudo: "psdo",
      semi: "sm",
      super: "spr",
      trans: "trns",
      ultra: "ultr",
      under: "undr",

      // Common suffixes
      tion: "tn",
      sion: "sn",
      ment: "mt",
      ness: "ns",
      able: "bl",
      ible: "bl",
      ical: "cl",
      ology: "gy",
      ography: "gphy",

      // Common words that abbreviate well
      and: "&",
      with: "w/",
      without: "w/o",
      about: "abt",
      through: "thru",
      because: "bc",
      before: "bfr",
      after: "aftr",
      between: "btwn",
      around: "arnd",
      tonight: "tnght",
      something: "smthg",
      nothing: "nthg",
      everything: "evrythg",
      someone: "smne",
      everyone: "evryne",
      another: "anthr",
      together: "tgthr",
      remember: "rmbr",
      believe: "blv",
      thought: "thght",
      should: "shld",
      would: "wld",
      could: "cld",
      right: "rt",
      night: "nght",
      light: "lght",
      heart: "hrt",
      world: "wrld",
      never: "nvr",
      every: "evry",
      where: "whr",
      there: "thr",
      here: "hr",
      your: "yr",
      you: "u",
      love: "luv",
      time: "tm",
      life: "lf",
      people: "ppl",
      little: "ltl",
      beautiful: "bful",
      wonderful: "wndrfl",
      different: "dfrnt",
      important: "imprtnt",
      experience: "exprnc",
      understand: "undrstnd",
      business: "bsnss",
      children: "chldrn",
      computer: "cmptr",
      government: "gvrnmt",
      information: "info",
      knowledge: "knwldg",
      language: "lng",
      literature: "lit",
      education: "edc",
      development: "dvlpmnt",
      management: "mgmt",
      technology: "tech",
      university: "univ",
      international: "intl",
      organization: "org",
      generation: "gen",
      communication: "comm",
      relationship: "rltnshp",
      environment: "env",
      situation: "sitn",
      opportunity: "opp",
      performance: "perf",
      particularly: "partclrly",
      especially: "espcly",
    };

    // Letter frequency in English (for vowel removal prioritization)
    this.letterFrequency = {
      e: 12.7,
      t: 9.1,
      a: 8.2,
      o: 7.5,
      i: 7.0,
      n: 6.7,
      s: 6.3,
      h: 6.1,
      r: 6.0,
      d: 4.3,
      l: 4.0,
      c: 2.8,
      u: 2.8,
      m: 2.4,
      w: 2.4,
      f: 2.2,
      g: 2.0,
      y: 2.0,
      p: 1.9,
      b: 1.3,
      v: 1.0,
      k: 0.8,
      j: 0.15,
      x: 0.15,
      q: 0.1,
      z: 0.07,
    };

    // Vowels ordered by removal priority (keep 'e' longer as it affects pronunciation cues)
    this.vowelRemovalOrder = ["u", "i", "o", "a", "e"];

    // Consonant clusters that can be simplified while maintaining recognition
    this.consonantSimplifications = {
      ck: "k",
      ph: "f",
      gh: "g",
      th: "t",
      ch: "c",
      sh: "s",
      wh: "w",
      sch: "sc",
      tch: "tc",
      dge: "dg",
      ght: "gt",
      kn: "n",
      wr: "r",
      ps: "s",
      sc: "c",
      gn: "n",
    };

    // Czech diacritic fallbacks for better PDF compatibility
    this.czechFallbacks = {
      á: "a",
      č: "c",
      ď: "d",
      é: "e",
      ě: "e",
      í: "i",
      ň: "n",
      ó: "o",
      ř: "r",
      š: "s",
      ť: "t",
      ú: "u",
      ů: "u",
      ý: "y",
      ž: "z",
      Á: "A",
      Č: "C",
      Ď: "D",
      É: "E",
      Ě: "E",
      Í: "I",
      Ň: "N",
      Ó: "O",
      Ř: "R",
      Š: "S",
      Ť: "T",
      Ú: "U",
      Ů: "U",
      Ý: "Y",
      Ž: "Z",
    };
  }

  // Convert Czech characters to ASCII equivalents for PDF compatibility
  convertCzechCharacters(text) {
    let result = text;
    for (const [czech, ascii] of Object.entries(this.czechFallbacks)) {
      result = result.replace(new RegExp(czech, "g"), ascii);
    }
    return result;
  }

  // Format time from minutes to MM:SS
  formatTime(minutes) {
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Calculate total setlist duration
  calculateTotalDuration(setlist) {
    return setlist.reduce((total, item) => {
      if (item.type === "midshow") {
        return total + 1; // Midshow is always 1 minute
      } else {
        return total + (item.duration || 3); // Default song duration is 3 minutes
      }
    }, 0);
  }

  export(setlist, songs = null) {
    if (setlist.length === 0) return;

    const { jsPDF } = window.jspdf;
    this.doc = new jsPDF();

    // Store songs reference for organizer section
    if (songs) {
      window.songs = songs;
    }

    // Add band setlist (existing functionality)
    this.addSetlistContent(setlist);

    // Add page break and organizer section
    this.doc.addPage();
    this.addOrganizerSection(setlist);

    this.save();
  }
  // Add the formal organizer section
  addOrganizerSection(setlist) {
    let yPosition = this.margin + 10;
    const lineHeight = 14 * this.PT_TO_MM;
    const sectionSpacing = 8 * this.PT_TO_MM;

    // Header
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(18);
    this.doc.text("SETLIST - ORGANIZER INFORMATION", this.margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Date and basic info
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    const today = new Date().toLocaleDateString();
    const totalDuration = this.calculateTotalDuration(setlist);

    this.doc.text(
      `Total Duration: ${this.formatTime(totalDuration)}`,
      this.margin,
      yPosition
    );
    yPosition += lineHeight * 0.8;
    this.doc.text(
      `Total Songs: ${
        setlist.filter((item) => item.type !== "midshow").length
      }`,
      this.margin,
      yPosition
    );
    yPosition += sectionSpacing * 2.5;

    // Table headers
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);

    const colPositions = {
      time: this.margin,
      title: this.margin + 25,
      vibe: this.margin + 110,
      duration: this.margin + 160,
    };

    // Draw header top line BEFORE text
    this.doc.line(
      this.margin,
      yPosition - 5,
      this.margin + this.contentWidth,
      yPosition - 5
    );

    this.doc.text("TIME", colPositions.time, yPosition);
    this.doc.text("TITLE", colPositions.title, yPosition);
    this.doc.text("VIBE/TYPE", colPositions.vibe, yPosition);
    this.doc.text("DURATION", colPositions.duration, yPosition);

    // Draw header bottom line AFTER text
    yPosition += 3;
    this.doc.line(
      this.margin,
      yPosition,
      this.margin + this.contentWidth,
      yPosition
    );
    yPosition += lineHeight * 0.8;

    // Content rows
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);

    let currentTime = 0;

    setlist.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > this.pageHeight - this.margin - 20) {
        this.doc.addPage();
        yPosition = this.margin + 25;

        // Redraw headers on new page
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(10);

        // Draw header top line BEFORE text
        this.doc.line(
          this.margin,
          yPosition - 1,
          this.margin + this.contentWidth,
          yPosition - 1
        );

        this.doc.text("TIME", colPositions.time, yPosition);
        this.doc.text("TITLE", colPositions.title, yPosition);
        this.doc.text("VIBE/TYPE", colPositions.vibe, yPosition);
        this.doc.text("DURATION", colPositions.duration, yPosition);

        // Draw header bottom line AFTER text
        yPosition += 5;
        this.doc.line(
          this.margin,
          yPosition,
          this.margin + this.contentWidth,
          yPosition
        );
        yPosition += lineHeight * 1;

        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(9);
      }

      const isSong = item.type !== "midshow";

      // Get song data from the songs array to access vibe and duration
      let songData = null;
      if (isSong && window.songs) {
        songData = window.songs.find((s) => s.name === item.song);
      }

      const duration = isSong ? songData?.duration || 3 : 1;
      const startTime = this.formatTime(currentTime);
      const endTime = this.formatTime(currentTime + duration);

      // Time range
      this.doc.text(`${startTime} - ${endTime}`, colPositions.time, yPosition);

      // Title (no shortening here)
      const title = this.convertCzechCharacters(isSong ? item.song : item.text);
      const maxTitleWidth = 80; // Adjust based on column width
      const wrappedTitle = this.wrapText(title, maxTitleWidth, 9);

      let titleYOffset = 0;
      wrappedTitle.forEach((line, lineIndex) => {
        this.doc.text(line, colPositions.title, yPosition + titleYOffset);
        titleYOffset += lineHeight * 0.9;
      });

      // Vibe/Type
      if (isSong) {
        const vibe = this.convertCzechCharacters(songData?.vibe || "Standard");
        this.doc.text(vibe, colPositions.vibe, yPosition);
      } else {
        this.doc.setFont("helvetica", "italic");
        this.doc.text("Midshow Break", colPositions.vibe, yPosition);
        this.doc.setFont("helvetica", "normal");
      }

      // Duration
      this.doc.text(`${duration}:00`, colPositions.duration, yPosition);

      // Notes (additional info if needed)
      if (item.notes) {
        const notes = this.convertCzechCharacters(item.notes);
        this.doc.text(notes, colPositions.notes, yPosition);
      }

      currentTime += duration;
      const rowHeight = Math.max(lineHeight, titleYOffset);
      yPosition += rowHeight;

      // Add subtle line between items (positioned properly after the row)
    });

    // Summary section
    yPosition += sectionSpacing;
    this.doc.line(
      this.margin,
      yPosition,
      this.margin + this.contentWidth,
      yPosition
    );
    yPosition += lineHeight;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11);
    this.doc.text("SUMMARY", this.margin, yPosition);
    yPosition += lineHeight;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    const songCount = setlist.filter((item) => item.type !== "midshow").length;
    const midshowCount = setlist.length - songCount;

    this.doc.text(`Total Songs: ${songCount}`, this.margin, yPosition);
    yPosition += lineHeight * 0.8;
    this.doc.text(`Midshow Breaks: ${midshowCount}`, this.margin, yPosition);
    yPosition += lineHeight * 0.8;
    this.doc.text(
      `Estimated Total Time: ${this.formatTime(totalDuration)}`,
      this.margin,
      yPosition
    );
    yPosition += lineHeight * 0.8;
    this.doc.text(
      `Expected End Time: ${this.formatTime(totalDuration)} after start`,
      this.margin,
      yPosition
    );
  }

  // Helper function to wrap text to fit in column
  wrapText(text, maxWidth, fontSize) {
    this.doc.setFontSize(fontSize);
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const testWidth = this.doc.getTextWidth(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Advanced cognitive psychology-based text shortening - ONLY for songs
  shortenPhrase(phrase, maxWidth, fontSize, isSong = true) {
    this.doc.setFontSize(fontSize);

    // Convert Czech characters first
    let workingPhrase = this.convertCzechCharacters(phrase);

    // If this is NOT a song (i.e., it's midshow), return the text as-is
    if (!isSong) {
      return workingPhrase;
    }

    // Be more aggressive with the width check - start shortening earlier
    const textWidth = this.doc.getTextWidth(workingPhrase);
    if (textWidth <= maxWidth * 0.9) return workingPhrase; // Start shortening at 90% of max width

    console.log(
      `Shortening "${workingPhrase}" - Width: ${textWidth}, Max: ${maxWidth}`
    );

    // Stage 1: Try simple vowel removal first (most readable)
    let shortened = this.applyVowelRemoval(workingPhrase);
    console.log(`After vowel removal: "${shortened}"`);
    if (this.doc.getTextWidth(shortened) <= maxWidth) return shortened;

    // Stage 2: Apply morpheme shortcuts
    shortened = this.applyMorphemeShortening(workingPhrase);
    console.log(`After morpheme shortening: "${shortened}"`);
    if (this.doc.getTextWidth(shortened) <= maxWidth) return shortened;

    // Stage 3: Combine vowel removal with morpheme shortcuts
    shortened = this.applyVowelRemoval(
      this.applyMorphemeShortening(workingPhrase)
    );
    console.log(`After combined shortening: "${shortened}"`);
    if (this.doc.getTextWidth(shortened) <= maxWidth) return shortened;

    // Stage 4: More aggressive shortening as last resort
    const final = this.applyAggressiveShortening(shortened, maxWidth, fontSize);
    console.log(`Final result: "${final}"`);
    return final;
  }

  // Calculate appropriate font size for midshow text to fit on one line
  calculateMidshowFontSize(text, maxWidth, baseFontSize) {
    // Convert Czech characters first
    const workingText = this.convertCzechCharacters(text);

    // Start with base font size and reduce until it fits
    let fontSize = baseFontSize;
    const minFontSize = 8; // Don't go smaller than 8pt

    this.doc.setFontSize(fontSize);
    let textWidth = this.doc.getTextWidth(workingText);

    while (textWidth > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      this.doc.setFontSize(fontSize);
      textWidth = this.doc.getTextWidth(workingText);
    }

    console.log(
      `Midshow "${workingText}" - Final font size: ${fontSize}, Width: ${textWidth}, Max: ${maxWidth}`
    );

    return fontSize;
  }

  // Simple vowel removal - most readable shortening method
  applyVowelRemoval(phrase) {
    return phrase
      .split(" ")
      .map((word) => {
        if (word.length <= 3) return word; // Keep very short words intact

        // Keep first and last letters, remove vowels from middle
        const first = word[0];
        const last = word[word.length - 1];
        const middle = word.substring(1, word.length - 1);

        // Remove vowels from middle section
        let processedMiddle = middle.replace(/[aeiouAEIOU]/g, "");

        // If we removed ALL vowels and the middle was long, keep one consonant cluster readable
        if (processedMiddle.length === 0 && middle.length > 1) {
          // Keep first consonant
          processedMiddle = middle[0];
        }

        const result = first + processedMiddle + last;
        return result;
      })
      .join(" ");
  }

  // Apply morpheme-based shortening using linguistic knowledge
  applyMorphemeShortening(phrase) {
    let result = phrase;

    // Only apply the most common and recognizable abbreviations
    const commonAbbreviations = {
      and: "&",
      with: "w/",
      without: "w/o",
      the: "the", // Keep "the" as is
      through: "thru",
      because: "bc",
      before: "bfr",
      after: "aftr",
      between: "btwn",
      around: "arnd",
      tonight: "tnght",
      something: "smthg",
      someone: "smne",
      together: "tgthr",
      remember: "rmbr",
      should: "shld",
      would: "wld",
      could: "cld",
      never: "nvr",
      every: "evry",
      people: "ppl",
      little: "ltl",
    };

    // Apply only these common abbreviations
    for (const [word, abbrev] of Object.entries(commonAbbreviations)) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      result = result.replace(regex, abbrev);
    }

    return result;
  }

  // Final aggressive shortening while maintaining key morphological markers
  applyAggressiveShortening(phrase, maxWidth, fontSize) {
    this.doc.setFontSize(fontSize);
    const words = phrase.split(/\s+/);
    const avgCharWidth = this.doc.getTextWidth("M");
    const totalAvailableChars = Math.floor(maxWidth / avgCharWidth);

    let result = "";
    let usedChars = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const remainingChars = totalAvailableChars - usedChars;
      const remainingWords = words.length - i;

      if (remainingChars <= 0) break;

      // Allocate characters proportionally, with minimum of 2 per word
      const targetCharsForWord = Math.max(
        2,
        Math.min(word.length, Math.floor(remainingChars / remainingWords))
      );

      if (result) result += " ";

      const shortenedWord =
        word.length <= targetCharsForWord
          ? word
          : this.preserveWordShape(word, targetCharsForWord);

      result += shortenedWord;
      usedChars = result.length;
    }

    return result;
  }

  // Preserve word shape when truncating
  preserveWordShape(word, maxLength) {
    if (word.length <= maxLength) return word;

    // Keep first and last character when possible
    if (maxLength >= 3) {
      const middleLength = maxLength - 2;
      const middle = word.substring(1, word.length - 1);
      const truncatedMiddle = middle.substring(0, middleLength);
      return word[0] + truncatedMiddle + word[word.length - 1];
    } else if (maxLength >= 2) {
      return word[0] + word[word.length - 1];
    } else {
      return word[0];
    }
  }

  // Enhanced font size calculation with single-page priority
  calculateFontSizes(setlist) {
    const songCount = setlist.filter((item) => item.type !== "midshow").length;
    const midshowCount = setlist.length - songCount;

    // If 9 or fewer songs, force everything to fit on one page
    if (songCount <= 9) {
      return this.calculateSinglePageSizes(setlist);
    }

    // For more than 9 songs, allow multiple pages with good readability
    const minSongSize = 42;
    const minMidshowSize = 28;

    return {
      songFontSize: minSongSize,
      midshowFontSize: minMidshowSize,
    };
  }

  // Calculate sizes to force fit on single page (9 songs or fewer)
  calculateSinglePageSizes(setlist) {
    const availableHeight = this.contentHeight - 20; // Reserve some margin

    // Calculate with minimal spacing
    let totalItems = setlist.length;
    let estimatedHeight = 0;

    // Start with reasonable minimum sizes
    let songSize = 32;
    let midshowSize = 20; // Reduced from 24 to prevent overflow

    // Iteratively find the largest sizes that fit
    for (let size = 60; size >= 24; size -= 2) {
      songSize = size;
      midshowSize = Math.max(16, size * 0.6); // Reduced ratio from 0.7 to 0.6

      estimatedHeight = 0;
      setlist.forEach((item, index) => {
        const isSong = item.type !== "midshow";
        const fontSize = isSong ? songSize : midshowSize;
        const lineHeight = fontSize * this.PT_TO_MM * 1.05; // Compact spacing

        // Small extra space before midshow items (except first)
        if (!isSong && index > 0) {
          estimatedHeight += fontSize * this.PT_TO_MM * 0.15;
        }

        estimatedHeight += lineHeight;
      });

      if (estimatedHeight <= availableHeight) {
        break; // Found sizes that fit
      }
    }

    return {
      songFontSize: Math.max(24, songSize),
      midshowFontSize: Math.max(14, midshowSize), // Reduced minimum from 18 to 14
    };
  }

  addSetlistContent(setlist) {
    const { songFontSize, midshowFontSize } = this.calculateFontSizes(setlist);
    const songCount = setlist.filter((item) => item.type !== "midshow").length;
    const forceSinglePage = songCount <= 9;

    let yPosition = this.margin + 15;

    this.doc.setFont("helvetica", "bold");

    setlist.forEach((item, index) => {
      const isSong = item.type !== "midshow";
      const text = isSong ? item.song : item.text;

      // Use different max widths
      const maxWidth = isSong ? this.contentWidth : this.contentWidth - 15; // Slightly less width for midshow due to indentation

      // Calculate actual font size to use
      let actualFontSize;
      if (isSong) {
        actualFontSize = songFontSize;
      } else {
        // For midshow, calculate size that fits the text on one line
        actualFontSize = this.calculateMidshowFontSize(
          text,
          maxWidth,
          midshowFontSize
        );
      }

      // Minimal extra spacing before midshow items
      if (!isSong && index > 0) {
        const extraSpace = forceSinglePage
          ? actualFontSize * this.PT_TO_MM * 0.1 // Very minimal for single page
          : actualFontSize * this.PT_TO_MM * 0.2; // Slightly more for multi-page
        yPosition += extraSpace;
      }

      // Apply intelligent shortening ONLY to songs, pass isSong parameter
      const displayText = this.shortenPhrase(
        text,
        maxWidth,
        actualFontSize,
        isSong
      );

      // Set font size and style
      this.doc.setFontSize(actualFontSize);

      if (!isSong) {
        this.doc.setFont("helvetica", "italic");
      } else {
        this.doc.setFont("helvetica", "bold");
      }

      // Position text higher - reduce baseline offset
      const xPos = isSong ? this.margin : this.margin + 15;
      const baselineOffset = actualFontSize * this.PT_TO_MM * 0.8; // Reduced from 0.75

      this.doc.text(displayText, xPos, yPosition + baselineOffset);

      // Compact line spacing based on actual font size used
      const lineHeight = forceSinglePage
        ? actualFontSize * this.PT_TO_MM * 1.05 // Very compact for single page
        : actualFontSize * this.PT_TO_MM * 1.15; // Normal for multi-page

      yPosition += lineHeight;

      // Only allow page breaks if more than 9 songs
      if (
        !forceSinglePage &&
        yPosition + lineHeight > this.pageHeight - this.margin
      ) {
        this.doc.addPage();
        yPosition = this.margin + 15;
      }
    });
  }

  save() {
    const today = new Date().toLocaleDateString();
    this.doc.save(`setlist-${today.replace(/\//g, "-")}.pdf`);
  }
}

// Export instance
const pdfExporter = new SetlistPDFExporter();
